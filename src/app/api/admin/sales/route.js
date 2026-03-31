import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import Order from "@/models/order.model";
import { requireAuth, requireAdmin } from "@/lib/auth";

function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  return d;
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// GET /api/admin/sales?from=2026-03-01&to=2026-03-31
export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const fromRaw = searchParams.get("from");
    const toRaw = searchParams.get("to");

    const from = parseDate(fromRaw, false);
    const to = parseDate(toRaw, true);

    if ((fromRaw && !from) || (toRaw && !to)) {
      return jsonError("Invalid date range.", 400);
    }

    const match = {
      status: { $nin: ["cancelled", "returned"] },
    };

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = from;
      if (to) match.createdAt.$lte = to;
    }

    const [result] = await Order.aggregate([
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                grossSales: { $sum: "$total" },
                subtotalSales: { $sum: "$subtotal" },
                totalShipping: { $sum: "$shippingFee" },
                totalDiscount: { $sum: "$discount" },
                avgOrderValue: { $avg: "$total" },
              },
            },
          ],

          itemsSummary: [
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: null,
                totalItemsSold: { $sum: "$items.qty" },
              },
            },
          ],

          statusBreakdown: [
            {
              $group: {
                _id: "$status",
                orders: { $sum: 1 },
                sales: { $sum: "$total" },
              },
            },
            { $sort: { _id: 1 } },
          ],

          dailySales: [
            {
              $group: {
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                  day: { $dayOfMonth: "$createdAt" },
                },
                orders: { $sum: 1 },
                sales: { $sum: "$total" },
                subtotal: { $sum: "$subtotal" },
                shipping: { $sum: "$shippingFee" },
                discount: { $sum: "$discount" },
              },
            },
            {
              $project: {
                _id: 0,
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: "$_id.day",
                  },
                },
                orders: 1,
                sales: 1,
                subtotal: 1,
                shipping: 1,
                discount: 1,
              },
            },
            { $sort: { date: 1 } },
          ],

          topProducts: [
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: false } },
            {
              $group: {
                _id: {
                  product: "$items.product",
                  productBarcode: "$items.productBarcode",
                  variantBarcode: "$items.variantBarcode",
                  title: "$items.title",
                },
                qtySold: { $sum: "$items.qty" },
                revenue: { $sum: "$items.lineTotal" },
              },
            },
            { $sort: { qtySold: -1, revenue: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                productId: "$_id.product",
                title: "$_id.title",
                productBarcode: "$_id.productBarcode",
                variantBarcode: "$_id.variantBarcode",
                qtySold: 1,
                revenue: 1,
              },
            },
          ],

          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 1,
                orderNo: 1,
                customer: 1,
                customerEmail: 1,
                status: 1,
                paymentMethod: 1,
                paymentStatus: 1,
                subtotal: 1,
                shippingFee: 1,
                discount: 1,
                total: 1,
                deliveryZone: 1,
                createdAt: 1,
                updatedAt: 1,
                itemCount: {
                  $sum: {
                    $map: {
                      input: { $ifNull: ["$items", []] },
                      as: "item",
                      in: { $ifNull: ["$$item.qty", 0] },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const summary = result?.summary?.[0] || {};
    const itemsSummary = result?.itemsSummary?.[0] || {};
    const statusBreakdown = Array.isArray(result?.statusBreakdown) ? result.statusBreakdown : [];
    const dailySales = Array.isArray(result?.dailySales) ? result.dailySales : [];
    const topProducts = Array.isArray(result?.topProducts) ? result.topProducts : [];
    const recentOrders = Array.isArray(result?.recentOrders) ? result.recentOrders : [];

    return NextResponse.json(
      {
        ok: true,
        filters: {
          from: from ? from.toISOString() : null,
          to: to ? to.toISOString() : null,
          excludedStatuses: ["cancelled", "returned"],
        },
        sales: {
          totalOrders: normalizeNumber(summary.totalOrders),
          grossSales: normalizeNumber(summary.grossSales),
          subtotalSales: normalizeNumber(summary.subtotalSales),
          totalShipping: normalizeNumber(summary.totalShipping),
          totalDiscount: normalizeNumber(summary.totalDiscount),
          totalItemsSold: normalizeNumber(itemsSummary.totalItemsSold),
          avgOrderValue: normalizeNumber(summary.avgOrderValue),
        },
        statusBreakdown: statusBreakdown.map((item) => ({
          status: item._id,
          orders: normalizeNumber(item.orders),
          sales: normalizeNumber(item.sales),
        })),
        dailySales: dailySales.map((item) => ({
          date: item.date,
          orders: normalizeNumber(item.orders),
          sales: normalizeNumber(item.sales),
          subtotal: normalizeNumber(item.subtotal),
          shipping: normalizeNumber(item.shipping),
          discount: normalizeNumber(item.discount),
        })),
        topProducts: topProducts.map((item) => ({
          productId: item.productId || null,
          title: item.title || "",
          productBarcode: item.productBarcode || "",
          variantBarcode: item.variantBarcode || "",
          qtySold: normalizeNumber(item.qtySold),
          revenue: normalizeNumber(item.revenue),
        })),
        recentOrders: recentOrders.map((order) => ({
          id: order._id.toString(),
          orderNo: order.orderNo,
          customer: order.customer || null,
          customerEmail: order.customerEmail || "",
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          subtotal: normalizeNumber(order.subtotal),
          shippingFee: normalizeNumber(order.shippingFee),
          discount: normalizeNumber(order.discount),
          total: normalizeNumber(order.total),
          deliveryZone: order.deliveryZone,
          itemCount: normalizeNumber(order.itemCount),
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin sales GET error:", error);
    return jsonError("Failed to fetch sales summary.", 500);
  }
}