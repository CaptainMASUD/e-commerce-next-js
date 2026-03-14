"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Package,
  Boxes,
  Tag,
  Barcode as BarcodeIcon,
  Sparkles,
  Flame,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function ToggleSwitch({ checked, onChange, disabled, PALETTE }) {
  const dims = { w: 44, h: 26, pad: 3, knob: 19 };
  const xOn = dims.w - dims.pad - dims.knob;
  const xOff = dims.pad;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer")}
      style={{ background: "transparent", border: "none", padding: 0 }}
      aria-pressed={checked}
    >
      <div
        className="relative rounded-full"
        style={{
          width: dims.w,
          height: dims.h,
          background: checked ? "rgba(16,185,129,0.18)" : "rgba(2,10,25,0.08)",
          border: checked
            ? "1px solid rgba(16,185,129,0.30)"
            : `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <motion.div
          className="absolute rounded-full"
          initial={false}
          animate={{ x: checked ? xOn : xOff }}
          transition={{ type: "spring", stiffness: 520, damping: 32 }}
          style={{
            top: dims.pad,
            width: dims.knob,
            height: dims.knob,
            background: "rgba(255,255,255,0.98)",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 10px 20px rgba(0,31,63,0.10)",
          }}
        />
      </div>
    </button>
  );
}

function Field({
  label,
  required,
  icon: Icon,
  rightSlot,
  children,
  className,
  multiline = false,
  hideIcon = false,
  FONT_STACK,
  PALETTE,
}) {
  return (
    <label className={cx("grid gap-2", className)} style={{ fontFamily: FONT_STACK }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {label ? (
            <span
              className="text-[12px] font-semibold tracking-wide"
              style={{ color: PALETTE.navy, fontFamily: FONT_STACK }}
            >
              {label}
            </span>
          ) : null}
          {required ? <span className="text-[12px] font-semibold text-rose-600">*</span> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      <div
        className={cx(
          "group gap-2 overflow-hidden rounded-2xl px-3 transition",
          "focus-within:ring-2 focus-within:ring-offset-2",
          multiline ? "block py-3" : "flex min-h-11 items-center"
        )}
        style={{
          background: "rgba(255,255,255,0.98)",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {!hideIcon && Icon ? (
          <div className={cx("shrink-0", multiline ? "mb-2" : "")}>
            <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </label>
  );
}

function Input({ className, PALETTE, FONT_STACK, ...props }) {
  return (
    <input
      {...props}
      className={cx("w-full bg-transparent outline-none text-sm font-medium", className)}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    />
  );
}

function Select({ className, children, PALETTE, FONT_STACK, ...props }) {
  return (
    <select
      {...props}
      className={cx("w-full bg-transparent outline-none cursor-pointer text-sm font-medium", className)}
      style={{ color: PALETTE.navy, height: 42, fontFamily: FONT_STACK }}
    >
      {children}
    </select>
  );
}

function Divider({ className }) {
  return (
    <div
      className={className}
      style={{ height: 1, width: "100%", background: "rgba(2,10,25,0.06)" }}
    />
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right, FONT_STACK, PALETTE }) {
  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      style={{ fontFamily: FONT_STACK }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="grid h-11 w-11 place-items-center rounded-3xl shrink-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(255,126,105,0.18), rgba(11,27,51,0.05) 65%), #fff",
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 12px 26px rgba(0,31,63,.07)",
          }}
        >
          <Icon className="h-5 w-5" style={{ color: PALETTE.navy }} />
        </div>
        <div className="min-w-0">
          <div className="text-[16px] font-semibold tracking-tight" style={{ color: PALETTE.navy }}>
            {title}
          </div>
          {subtitle ? (
            <div className="text-[12px] font-medium" style={{ color: PALETTE.muted, marginTop: 4 }}>
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function PreviewTile({ label, value, full, PALETTE }) {
  return (
    <div
      className="rounded-[20px] p-4"
      style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${PALETTE.border}` }}
      title={full || value}
    >
      <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold break-words" style={{ color: PALETTE.navy }}>
        {value || "—"}
      </div>
    </div>
  );
}

function VariantImageUploader({ variant, onFiles, onRemoveImage, PALETTE }) {
  const previews = safeArray(variant?.images);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy }}>
            Variant images
          </div>
          <div className="text-[12px] font-medium" style={{ color: PALETTE.muted, marginTop: 4 }}>
            Existing and new images for this exact variant combination.
          </div>
        </div>

        <label
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.navy,
            boxShadow: "0 10px 24px rgba(0,31,63,.06)",
            minHeight: 42,
          }}
        >
          <Upload className="h-4 w-4" />
          Add images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              onFiles(files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div
        className="rounded-[24px] border border-dashed p-4"
        style={{
          borderColor: "rgba(2,10,25,0.14)",
          background: "rgba(11,27,51,0.03)",
        }}
      >
        {previews.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {previews.map((img, idx) => (
              <div
                key={img.id}
                className="relative overflow-hidden rounded-2xl"
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: "rgba(255,255,255,0.92)",
                }}
              >
                <img src={img.preview || img.url} alt="" className="h-28 w-full object-cover" />
                <div
                  className="absolute left-2 top-2 rounded-xl px-2 py-1 text-[10px] font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                  }}
                >
                  {img.file ? "new" : "existing"}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                    boxShadow: "0 8px 20px rgba(0,31,63,0.12)",
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3" style={{ color: PALETTE.muted }}>
            <div
              className="grid h-10 w-10 place-items-center rounded-3xl"
              style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
            >
              <ImageIcon className="h-5 w-5" style={{ color: PALETTE.navy }} />
            </div>
            <div className="text-[12px] font-medium">No variant images yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductCoreVariantsSection({
  form,
  product,
  categories,
  filteredBrands,
  subcategoryOptions,
  ALLOWED_PRODUCT_TYPE,
  sectionBusy,
  saveCoreSection,
  saveVariantsSection,
  setField,
  setEditing,
  updateVariant,
  setVariantAttribute,
  removeVariantAttribute,
  addVariantImages,
  removeVariantImage,
  randomDigits,
  toNumber,
  safeArray,
  PALETTE,
  FONT_STACK,
}) {
  return (
    <div className="space-y-5">
      <div
        className="rounded-[24px] overflow-visible"
        style={{
          background: PALETTE.card,
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "0 18px 55px rgba(0,31,63,0.08)",
          fontFamily: FONT_STACK,
        }}
      >
        <div className="p-5 sm:p-6">
          <SectionHeader
            icon={Layers}
            title="Core"
            subtitle="Basic product identity, pricing, stock and product type."
            FONT_STACK={FONT_STACK}
            PALETTE={PALETTE}
            right={
              <button
                type="button"
                onClick={saveCoreSection}
                disabled={sectionBusy.core}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
                style={{
                  background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                  boxShadow: "0 16px 34px rgba(0,31,63,.20)",
                  minHeight: 42,
                }}
              >
                {sectionBusy.core ? <span className="animate-spin">◌</span> : <SaveIcon />}
                Save Core
              </button>
            }
          />

          <div className="mt-6">
            <Divider />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PreviewTile label="Title" value={form?.title} PALETTE={PALETTE} />
            <PreviewTile
              label="Category / Brand"
              value={`${product?.category?.name || "—"} / ${product?.brand?.name || "—"}`}
              PALETTE={PALETTE}
            />
            <PreviewTile
              label="Simple pricing"
              value={
                form?.productType === "simple"
                  ? `৳${form?.price || 0}${form?.salePrice ? ` → ৳${form.salePrice}` : ""}`
                  : "Uses variants"
              }
              PALETTE={PALETTE}
            />
            <PreviewTile
              label="Stock or Variants"
              value={
                form?.productType === "simple"
                  ? `${form?.stockQty ?? 0} stock`
                  : `${safeArray(form?.variants).length} variants`
              }
              PALETTE={PALETTE}
            />
            <PreviewTile
              label="Barcode"
              value={form?.productType === "simple" ? form?.barcode || "—" : "Managed by variants"}
              PALETTE={PALETTE}
            />
            <PreviewTile
              label="Flags"
              value={`${form?.isNew ? "New" : "Normal"} · ${form?.isTrending ? "Trending" : "Regular"}`}
              PALETTE={PALETTE}
            />
          </div>

          <div className="mb-6 mt-6">
            <Divider />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Product name" required icon={Package} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
              <Input
                PALETTE={PALETTE}
                FONT_STACK={FONT_STACK}
                value={form?.title || ""}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Apple iPhone 15"
              />
            </Field>

            <Field label="Product type" required icon={Boxes} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
              <Select
                PALETTE={PALETTE}
                FONT_STACK={FONT_STACK}
                value={form?.productType || "simple"}
                onChange={(e) => setField("productType", e.target.value)}
              >
                {ALLOWED_PRODUCT_TYPE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category" required icon={Layers} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
              <Select
                PALETTE={PALETTE}
                FONT_STACK={FONT_STACK}
                value={form?.category || ""}
                onChange={(e) => setField("category", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Subcategory" icon={Layers} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
              <Select
                PALETTE={PALETTE}
                FONT_STACK={FONT_STACK}
                value={form?.subcategory || ""}
                onChange={(e) => setField("subcategory", e.target.value)}
                disabled={!form?.category || subcategoryOptions.length === 0}
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Brand" required icon={Tag} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
              <Select
                PALETTE={PALETTE}
                FONT_STACK={FONT_STACK}
                value={form?.brand || ""}
                onChange={(e) => setField("brand", e.target.value)}
              >
                <option value="">Select brand</option>
                {filteredBrands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="hidden md:block" />

            {form?.productType === "simple" ? (
              <>
                <Field label="Price" required icon={Package} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                  <Input
                    PALETTE={PALETTE}
                    FONT_STACK={FONT_STACK}
                    inputMode="decimal"
                    value={form?.price ?? ""}
                    onChange={(e) => setField("price", e.target.value)}
                    placeholder="120000"
                  />
                </Field>

                <Field label="Sale price" icon={Package} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                  <Input
                    PALETTE={PALETTE}
                    FONT_STACK={FONT_STACK}
                    inputMode="decimal"
                    value={form?.salePrice ?? ""}
                    onChange={(e) => setField("salePrice", e.target.value)}
                    placeholder="115000"
                  />
                </Field>

                <Field
                  label="Barcode"
                  icon={BarcodeIcon}
                  FONT_STACK={FONT_STACK}
                  PALETTE={PALETTE}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setField("barcode", randomDigits(13))}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold"
                      style={{
                        background: "rgba(255,255,255,0.96)",
                        border: `1px solid ${PALETTE.border}`,
                        color: PALETTE.navy,
                      }}
                    >
                      <BarcodeIcon className="h-4 w-4" />
                      Generate
                    </button>
                  }
                >
                  <Input
                    PALETTE={PALETTE}
                    FONT_STACK={FONT_STACK}
                    value={form?.barcode || ""}
                    onChange={(e) => setField("barcode", e.target.value)}
                    placeholder="Auto / manual"
                  />
                </Field>

                <Field label="Stock qty" required icon={Boxes} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                  <Input
                    PALETTE={PALETTE}
                    FONT_STACK={FONT_STACK}
                    inputMode="numeric"
                    value={form?.stockQty ?? 0}
                    onChange={(e) => setField("stockQty", Math.max(0, toNumber(e.target.value, 0) ?? 0))}
                    placeholder="0"
                  />
                </Field>
              </>
            ) : (
              <div
                className="md:col-span-2 rounded-[20px] p-4"
                style={{
                  background: PALETTE.soft2,
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  Variable product detected. Price and stock are controlled by variant rows below.
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: PALETTE.muted }} />
              <span className="text-[12px] font-medium" style={{ color: PALETTE.navy }}>
                New
              </span>
              <ToggleSwitch
                PALETTE={PALETTE}
                checked={Boolean(form?.isNew)}
                onChange={(v) => setField("isNew", v)}
              />
            </div>

            <div
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{ background: PALETTE.soft, border: `1px solid ${PALETTE.border}` }}
            >
              <Flame className="h-4 w-4" style={{ color: PALETTE.muted }} />
              <span className="text-[12px] font-medium" style={{ color: PALETTE.navy }}>
                Trending
              </span>
              <ToggleSwitch
                PALETTE={PALETTE}
                checked={Boolean(form?.isTrending)}
                onChange={(v) => setField("isTrending", v)}
              />
            </div>
          </div>
        </div>
      </div>

      {form?.productType === "variable" ? (
        <div
          className="rounded-[24px] overflow-visible"
          style={{
            background: PALETTE.card,
            border: `1px solid ${PALETTE.border}`,
            boxShadow: "0 18px 55px rgba(0,31,63,0.08)",
            fontFamily: FONT_STACK,
          }}
        >
          <div className="p-5 sm:p-6">
            <SectionHeader
              icon={Boxes}
              title="Variants"
              subtitle="Edit barcode, stock, price, attributes, and per-variant images."
              FONT_STACK={FONT_STACK}
              PALETTE={PALETTE}
              right={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing((prev) => ({ ...prev, variants: true }));
                      setField("variants", [
                        ...safeArray(form?.variants),
                        {
                          id: crypto.randomUUID?.() || String(Date.now()),
                          barcode: "",
                          attributes: { storage: "", color: "" },
                          price: "",
                          salePrice: "",
                          stockQty: 0,
                          isActive: true,
                          images: [],
                        },
                      ]);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.96)",
                      border: `1px solid ${PALETTE.border}`,
                      color: PALETTE.navy,
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Variant
                  </button>

                  <button
                    type="button"
                    onClick={saveVariantsSection}
                    disabled={sectionBusy.variants}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
                    style={{
                      background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                      boxShadow: "0 16px 34px rgba(0,31,63,.20)",
                      minHeight: 42,
                    }}
                  >
                    {sectionBusy.variants ? <span className="animate-spin">◌</span> : <SaveIcon />}
                    Save Variants
                  </button>
                </div>
              }
            />

            <div className="mt-6">
              <Divider />
            </div>

            <div className="mt-6 space-y-3">
              {safeArray(form?.variants).map((v, idx) => (
                <div
                  key={v.id}
                  className="rounded-[24px] p-4"
                  style={{
                    background: "rgba(255,255,255,0.92)",
                    border: `1px solid ${PALETTE.border}`,
                    boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                        style={{
                          background: PALETTE.soft,
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.navy,
                        }}
                      >
                        Variant #{idx + 1}
                      </span>

                      <div
                        className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                        style={{
                          background: PALETTE.soft,
                          border: `1px solid ${PALETTE.border}`,
                        }}
                      >
                        <span className="text-[12px] font-medium" style={{ color: PALETTE.navy }}>
                          Active
                        </span>
                        <ToggleSwitch
                          PALETTE={PALETTE}
                          checked={v.isActive !== false}
                          onChange={() =>
                            updateVariant(v.id, {
                              isActive: !(v.isActive !== false),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateVariant(v.id, { barcode: randomDigits(13) })}
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.96)",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.navy,
                        }}
                      >
                        <BarcodeIcon className="h-4 w-4" />
                        Generate
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            "variants",
                            safeArray(form?.variants).filter((x) => x.id !== v.id)
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                        style={{
                          background: "rgba(255,107,107,0.14)",
                          border: "1px solid rgba(255,107,107,0.25)",
                          color: PALETTE.navy,
                        }}
                      >
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Barcode" required icon={BarcodeIcon} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Input
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        value={v.barcode}
                        onChange={(e) => updateVariant(v.id, { barcode: e.target.value })}
                        placeholder="auto / manual"
                      />
                    </Field>

                    <Field label="Stock qty" required icon={Boxes} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Input
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        inputMode="numeric"
                        value={v.stockQty}
                        onChange={(e) =>
                          updateVariant(v.id, {
                            stockQty: Math.max(0, toNumber(e.target.value, 0) ?? 0),
                          })
                        }
                        placeholder="0"
                      />
                    </Field>

                    <Field label="Price" required icon={Package} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Input
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        inputMode="decimal"
                        value={v.price}
                        onChange={(e) => updateVariant(v.id, { price: e.target.value })}
                        placeholder="120000"
                      />
                    </Field>

                    <Field label="Sale price" icon={Package} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Input
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        inputMode="decimal"
                        value={v.salePrice}
                        onChange={(e) => updateVariant(v.id, { salePrice: e.target.value })}
                        placeholder="optional"
                      />
                    </Field>
                  </div>

                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy }}>
                        Attributes
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(v.id, {
                            attributes: { ...(v.attributes || {}), "": "" },
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.96)",
                          border: `1px solid ${PALETTE.border}`,
                          color: PALETTE.navy,
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add attribute
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {Object.entries(v.attributes || {}).length ? (
                        Object.entries(v.attributes || {}).map(([k, val], i) => (
                          <div key={k + i} className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                              <div
                                className="rounded-2xl px-3"
                                style={{
                                  background: "rgba(255,255,255,0.98)",
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                <Input
                                  PALETTE={PALETTE}
                                  FONT_STACK={FONT_STACK}
                                  value={k}
                                  onChange={(e) =>
                                    setVariantAttribute(v.id, k, e.target.value, String(val), "rename")
                                  }
                                  placeholder="storage"
                                />
                              </div>
                            </div>

                            <div className="col-span-6">
                              <div
                                className="rounded-2xl px-3"
                                style={{
                                  background: "rgba(255,255,255,0.98)",
                                  border: `1px solid ${PALETTE.border}`,
                                }}
                              >
                                <Input
                                  PALETTE={PALETTE}
                                  FONT_STACK={FONT_STACK}
                                  value={String(val)}
                                  onChange={(e) =>
                                    setVariantAttribute(v.id, k, k, e.target.value, "value")
                                  }
                                  placeholder="128GB"
                                />
                              </div>
                            </div>

                            <div className="col-span-1 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => removeVariantAttribute(v.id, k)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                                style={{
                                  background: "rgba(255,107,107,0.12)",
                                  border: "1px solid rgba(255,107,107,0.22)",
                                  color: PALETTE.navy,
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                          No attributes.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Divider />
                  </div>

                  <div className="mt-6">
                    <VariantImageUploader
                      variant={v}
                      onFiles={(files) => addVariantImages(v.id, files)}
                      onRemoveImage={(imageIndex) => removeVariantImage(v.id, imageIndex)}
                      PALETTE={PALETTE}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SaveIcon() {
  return <span className="inline-block">✓</span>;
}