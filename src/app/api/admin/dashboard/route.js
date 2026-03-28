export const runtime = "nodejs";

import { NextResponse } from "next/server";
import connectDB from "@/lib/dbConfig";
import { requireAuth, requireAdmin } from "@/lib/auth";

import User from "@/models/user.model";
import Category from "@/models/category.model";
import Brand from "@/models/brand.model";
import Product from "@/models/product.model";
import Order from "@/models/order.model";

const LOW_STOCK_THRESHOLD = 5;

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function normalizeProductCard(p) {
  const variants = Array.isArray(p?.variants) ? p.variants : [];

  const availableStock =
    p?.productType === "variable"
      ? variants.reduce((sum, v) => {
          if (v?.isActive === false) return sum;
          const qty = typeof v?.stockQty === "number" ? v.stockQty : 0;
          return sum + Math.max(qty, 0);
        }, 0)
      : Math.max(Number(p?.stockQty || 0), 0);

  let finalPrice = Number(p?.price || 0);

  if (p?.productType === "variable") {
    const activeVariants = variants.filter((v) => v?.isActive !== false);

    const finals = activeVariants
      .map((v) => {
        const base =
          typeof v?.price === "number" ? v.price : Number(p?.price || 0);
        const sale =
          typeof v?.salePrice === "number" ? v.salePrice : null;

        return typeof sale === "number" && sale >= 0 ? sale : base;
      })
      .filter((n) => typeof n === "number" && n >= 0);

    if (finals.length) finalPrice = Math.min(...finals);
  } else {
    if (typeof p?.salePrice === "number" && p.salePrice >= 0) {
      finalPrice = p.salePrice;
    }
  }

  const basePrice = Number(p?.price || 0);
  const discountAmount = Math.max(basePrice - finalPrice, 0);
  const discountPercent =
    basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;

  return {
    ...p,
    availableStock,
    finalPrice,
    discountAmount,
    discountPercent,
  };
}

export async function GET(req) {
  const auth = requireAdmin(await requireAuth(req));
  if (!auth.ok) return auth.res;

  try {
    await connectDB();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);

    const revenueStatuses = ["confirmed", "processing", "shipped", "delivered"];

    const [
      // USERS
      userStats,

      // CATEGORY
      categoryStats,

      // BRAND
      brandStats,

      // PRODUCT COUNTS
      productStats,

      // ORDER COUNTS + SALES
      orderStats,

      // TODAY SALES
      todaySalesAgg,

      // MONTH SALES
      monthSalesAgg,

      // STOCK OVERVIEW
      stockOverview,

      // RECENT ORDERS
      recentOrders,

      // RECENT USERS
      recentUsers,

      // TRENDING PRODUCTS
      trendingProducts,

      // NEW PRODUCTS
      newProducts,
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },

            customers: {
              $sum: { $cond: [{ $eq: ["$role", "customer"] }, 1, 0] },
            },
            admins: {
              $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
            },

            active: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            inactive: {
              $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
            },

            verified: {
              $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] },
            },
            unverified: {
              $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] },
            },
          },
        },
      ]),

      Category.aggregate([
        {
          $project: {
            isActive: 1,
            subcategories: { $ifNull: ["$subcategories", []] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            inactive: {
              $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
            },
            totalSubcategories: {
              $sum: { $size: "$subcategories" },
            },
            activeSubcategories: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$subcategories",
                    as: "sub",
                    cond: { $eq: ["$$sub.isActive", true] },
                  },
                },
              },
            },
            inactiveSubcategories: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$subcategories",
                    as: "sub",
                    cond: { $eq: ["$$sub.isActive", false] },
                  },
                },
              },
            },
          },
        },
      ]),

      Brand.aggregate([
        {
          $project: {
            isActive: 1,
            categoryIds: { $ifNull: ["$categoryIds", []] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            inactive: {
              $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] },
            },
            totalCategoryLinks: {
              $sum: { $size: "$categoryIds" },
            },
          },
        },
      ]),

      Product.aggregate([
        {
          $project: {
            productType: 1,
            isTrending: 1,
            isNew: 1,
            barcode: { $ifNull: ["$barcode", ""] },
            variants: { $ifNull: ["$variants", []] },
            specifications: { $ifNull: ["$specifications", []] },
            highlights: { $ifNull: ["$highlights", []] },
            availableStock: {
              $cond: [
                { $eq: ["$productType", "variable"] },
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: { $ifNull: ["$variants", []] },
                          as: "v",
                          cond: { $ne: ["$$v.isActive", false] },
                        },
                      },
                      as: "v",
                      in: { $max: [{ $ifNull: ["$$v.stockQty", 0] }, 0] },
                    },
                  },
                },
                { $max: [{ $ifNull: ["$stockQty", 0] }, 0] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },

            simple: {
              $sum: { $cond: [{ $eq: ["$productType", "simple"] }, 1, 0] },
            },
            variable: {
              $sum: { $cond: [{ $eq: ["$productType", "variable"] }, 1, 0] },
            },

            trending: {
              $sum: { $cond: [{ $eq: ["$isTrending", true] }, 1, 0] },
            },
            new: {
              $sum: { $cond: [{ $eq: ["$isNew", true] }, 1, 0] },
            },

            inStock: {
              $sum: { $cond: [{ $gt: ["$availableStock", 0] }, 1, 0] },
            },
            outOfStock: {
              $sum: { $cond: [{ $lte: ["$availableStock", 0] }, 1, 0] },
            },

            simpleWithBarcode: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$productType", "simple"] },
                      { $ne: ["$barcode", ""] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            variableWithVariants: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$productType", "variable"] },
                      { $gt: [{ $size: "$variants" }, 0] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            withSpecifications: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$specifications" }, 0] }, 1, 0],
              },
            },

            withHighlights: {
              $sum: {
                $cond: [{ $gt: [{ $size: "$highlights" }, 0] }, 1, 0],
              },
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },

            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            confirmed: {
              $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
            },
            processing: {
              $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] },
            },
            shipped: {
              $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] },
            },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
            returned: {
              $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] },
            },

            codOrders: {
              $sum: { $cond: [{ $eq: ["$paymentMethod", "cod"] }, 1, 0] },
            },

            insideDhaka: {
              $sum: {
                $cond: [{ $eq: ["$deliveryZone", "inside_dhaka"] }, 1, 0],
              },
            },
            outsideDhaka: {
              $sum: {
                $cond: [{ $eq: ["$deliveryZone", "outside_dhaka"] }, 1, 0],
              },
            },

            totalRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", revenueStatuses] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },

            totalSubtotal: {
              $sum: { $ifNull: ["$subtotal", 0] },
            },

            totalShipping: {
              $sum: { $ifNull: ["$shippingFee", 0] },
            },

            totalDiscount: {
              $sum: { $ifNull: ["$discount", 0] },
            },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: { $in: revenueStatuses },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $ifNull: ["$total", 0] } },
            orders: { $sum: 1 },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart, $lte: todayEnd },
            status: { $in: revenueStatuses },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: { $ifNull: ["$total", 0] } },
            orders: { $sum: 1 },
          },
        },
      ]),

      Product.aggregate([
        {
          $project: {
            title: 1,
            slug: 1,
            primaryImage: 1,
            productType: 1,
            barcode: 1,
            stockQty: { $ifNull: ["$stockQty", 0] },
            variants: { $ifNull: ["$variants", []] },
            availableStock: {
              $cond: [
                { $eq: ["$productType", "variable"] },
                {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: { $ifNull: ["$variants", []] },
                          as: "v",
                          cond: { $ne: ["$$v.isActive", false] },
                        },
                      },
                      as: "v",
                      in: { $max: [{ $ifNull: ["$$v.stockQty", 0] }, 0] },
                    },
                  },
                },
                { $max: [{ $ifNull: ["$stockQty", 0] }, 0] },
              ],
            },
          },
        },
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  lowStockCount: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gt: ["$availableStock", 0] },
                            { $lte: ["$availableStock", LOW_STOCK_THRESHOLD] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  outOfStockCount: {
                    $sum: {
                      $cond: [{ $lte: ["$availableStock", 0] }, 1, 0],
                    },
                  },
                },
              },
            ],
            lowStockProducts: [
              {
                $match: {
                  availableStock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
                },
              },
              { $sort: { availableStock: 1, _id: 1 } },
              { $limit: 10 },
            ],
            outOfStockProducts: [
              {
                $match: {
                  availableStock: { $lte: 0 },
                },
              },
              { $sort: { createdAt: -1, _id: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]),

      Order.find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(8)
        .select(
          [
            "orderNo",
            "customer",
            "customerEmail",
            "shippingAddress",
            "deliveryZone",
            "subtotal",
            "shippingFee",
            "discount",
            "total",
            "status",
            "paymentMethod",
            "paymentStatus",
            "createdAt",
          ].join(" ")
        )
        .lean(),

      User.find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(8)
        .select("name email role status isVerified createdAt")
        .lean(),

      Product.find({ isTrending: true })
        .sort({ createdAt: -1, _id: -1 })
        .limit(8)
        .select(
          [
            "title",
            "slug",
            "barcode",
            "price",
            "salePrice",
            "productType",
            "stockQty",
            "variants",
            "primaryImage",
            "isTrending",
            "createdAt",
          ].join(" ")
        )
        .lean(),

      Product.find({ isNew: true })
        .sort({ createdAt: -1, _id: -1 })
        .limit(8)
        .select(
          [
            "title",
            "slug",
            "barcode",
            "price",
            "salePrice",
            "productType",
            "stockQty",
            "variants",
            "primaryImage",
            "isNew",
            "createdAt",
          ].join(" ")
        )
        .lean(),
    ]);

    const users = userStats?.[0] || {
      total: 0,
      customers: 0,
      admins: 0,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0,
    };

    const categories = categoryStats?.[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      totalSubcategories: 0,
      activeSubcategories: 0,
      inactiveSubcategories: 0,
    };

    const brands = brandStats?.[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      totalCategoryLinks: 0,
    };

    const products = productStats?.[0] || {
      total: 0,
      simple: 0,
      variable: 0,
      trending: 0,
      new: 0,
      inStock: 0,
      outOfStock: 0,
      simpleWithBarcode: 0,
      variableWithVariants: 0,
      withSpecifications: 0,
      withHighlights: 0,
    };

    const orders = orderStats?.[0] || {
      total: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      codOrders: 0,
      insideDhaka: 0,
      outsideDhaka: 0,
      totalRevenue: 0,
      totalSubtotal: 0,
      totalShipping: 0,
      totalDiscount: 0,
    };

    const todaySales = todaySalesAgg?.[0] || { revenue: 0, orders: 0 };
    const monthSales = monthSalesAgg?.[0] || { revenue: 0, orders: 0 };

    const stock = stockOverview?.[0] || {};
    const stockCounts = stock?.counts?.[0] || {
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return NextResponse.json(
      {
        overview: {
          users: {
            total: users.total,
            customers: users.customers,
            admins: users.admins,
            active: users.active,
            inactive: users.inactive,
            verified: users.verified,
            unverified: users.unverified,
          },

          categories: {
            total: categories.total,
            active: categories.active,
            inactive: categories.inactive,
            totalSubcategories: categories.totalSubcategories,
            activeSubcategories: categories.activeSubcategories,
            inactiveSubcategories: categories.inactiveSubcategories,
          },

          brands: {
            total: brands.total,
            active: brands.active,
            inactive: brands.inactive,
            totalCategoryLinks: brands.totalCategoryLinks,
          },

          products: {
            total: products.total,
            simple: products.simple,
            variable: products.variable,
            trending: products.trending,
            new: products.new,
            inStock: products.inStock,
            outOfStock: products.outOfStock,
            lowStockCount: stockCounts.lowStockCount,
            outOfStockCount: stockCounts.outOfStockCount,
            simpleWithBarcode: products.simpleWithBarcode,
            variableWithVariants: products.variableWithVariants,
            withSpecifications: products.withSpecifications,
            withHighlights: products.withHighlights,
          },

          orders: {
            total: orders.total,
            pending: orders.pending,
            confirmed: orders.confirmed,
            processing: orders.processing,
            shipped: orders.shipped,
            delivered: orders.delivered,
            cancelled: orders.cancelled,
            returned: orders.returned,
            codOrders: orders.codOrders,
            insideDhaka: orders.insideDhaka,
            outsideDhaka: orders.outsideDhaka,
          },

          sales: {
            totalRevenue: orders.totalRevenue,
            totalSubtotal: orders.totalSubtotal,
            totalShipping: orders.totalShipping,
            totalDiscount: orders.totalDiscount,
            todayRevenue: todaySales.revenue,
            todayOrders: todaySales.orders,
            monthRevenue: monthSales.revenue,
            monthOrders: monthSales.orders,
          },
        },

        widgets: {
          lowStockProducts: (stock.lowStockProducts || []).map((p) => ({
            _id: p._id,
            title: p.title,
            slug: p.slug,
            primaryImage: p.primaryImage || null,
            productType: p.productType,
            barcode: p.barcode || "",
            availableStock: p.availableStock || 0,
          })),

          outOfStockProducts: (stock.outOfStockProducts || []).map((p) => ({
            _id: p._id,
            title: p.title,
            slug: p.slug,
            primaryImage: p.primaryImage || null,
            productType: p.productType,
            barcode: p.barcode || "",
            availableStock: p.availableStock || 0,
          })),

          recentOrders,

          recentUsers,

          trendingProducts: trendingProducts.map(normalizeProductCard),

          newProducts: newProducts.map(normalizeProductCard),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard overview",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}