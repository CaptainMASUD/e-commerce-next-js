"use client";

import React from "react";
import { Palette, Image as ImageIcon, Upload } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");

function safeArray(v) {
  return Array.isArray(v) ? v : [];
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

function ImagePicker({ label, multiple, previewUrls = [], onFiles, PALETTE }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy }}>
          {label}
        </div>
        <label
          className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.96)",
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.navy,
          }}
        >
          <Upload className="h-4 w-4" />
          Choose {multiple ? "files" : "file"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple={multiple}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              onFiles(files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div
        className="rounded-[22px] border border-dashed p-4"
        style={{ borderColor: "rgba(2,10,25,0.14)", background: "rgba(11,27,51,0.03)" }}
      >
        {previewUrls?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previewUrls.map((src, i) => (
              <div
                key={src + i}
                className="overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${PALETTE.border}` }}
              >
                <img src={src} alt="" className="h-28 w-full object-cover" />
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
            <div className="text-[12px] font-medium">No new files selected.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children, FONT_STACK, PALETTE }) {
  return (
    <label className="grid gap-2" style={{ fontFamily: FONT_STACK }}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy }}>
          {label}
        </span>
      </div>

      <div
        className="flex min-h-11 items-center gap-2 overflow-hidden rounded-2xl px-3"
        style={{
          background: "rgba(255,255,255,0.98)",
          border: `1px solid ${PALETTE.border}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0" style={{ color: PALETTE.muted }} /> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </label>
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

export default function ProductImagesSection({
  form,
  sectionBusy,
  saveImagesSection,
  newPrimaryPreview,
  newGalleryPreviews,
  galleryMode,
  setGalleryMode,
  setPrimary,
  setGallery,
  PALETTE,
  FONT_STACK,
}) {
  return (
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
          icon={Palette}
          title="Images"
          subtitle="Preview current images and upload replacement or appended gallery files."
          FONT_STACK={FONT_STACK}
          PALETTE={PALETTE}
          right={
            <button
              type="button"
              onClick={saveImagesSection}
              disabled={sectionBusy.images}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
              style={{
                background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                minHeight: 42,
              }}
            >
              Save Images
            </button>
          }
        />

        <div className="mt-6">
          <Divider />
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy, marginBottom: 10 }}>
              Current primary image
            </div>
            <div
              className="overflow-hidden rounded-[22px]"
              style={{
                border: `1px solid ${PALETTE.border}`,
                background: PALETTE.soft2,
              }}
            >
              {form?.primaryImage?.url ? (
                <img src={form.primaryImage.url} alt="Primary" className="h-64 w-full object-cover" />
              ) : (
                <div className="grid h-64 place-items-center">
                  <ImageIcon className="h-6 w-6" style={{ color: PALETTE.muted }} />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy, marginBottom: 10 }}>
              Current gallery
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {safeArray(form?.galleryImages).length ? (
                safeArray(form.galleryImages).map((img, idx) => (
                  <div
                    key={img?.url || idx}
                    className="overflow-hidden rounded-2xl"
                    style={{ border: `1px solid ${PALETTE.border}` }}
                  >
                    <img src={img?.url} alt="Gallery" className="h-28 w-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  No gallery images.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="my-6">
          <Divider />
        </div>

        <div className="space-y-6">
          <ImagePicker
            label="Replace primary image"
            multiple={false}
            previewUrls={newPrimaryPreview ? [newPrimaryPreview] : []}
            onFiles={setPrimary}
            PALETTE={PALETTE}
          />

          <div>
            <Divider />
          </div>

          <Field label="Gallery update mode" icon={ImageIcon} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
            <Select
              PALETTE={PALETTE}
              FONT_STACK={FONT_STACK}
              value={galleryMode}
              onChange={(e) => setGalleryMode(e.target.value)}
            >
              <option value="append">append</option>
              <option value="replace">replace</option>
              <option value="keep">keep</option>
            </Select>
          </Field>

          <ImagePicker
            label="Upload gallery images"
            multiple
            previewUrls={newGalleryPreviews}
            onFiles={setGallery}
            PALETTE={PALETTE}
          />

          <div
            className="rounded-[20px] p-4"
            style={{ background: PALETTE.soft2, border: `1px solid ${PALETTE.border}` }}
          >
            <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
              Use <span style={{ color: PALETTE.navy, fontWeight: 700 }}>append</span> to add more gallery images, or{" "}
              <span style={{ color: PALETTE.navy, fontWeight: 700 }}>replace</span> to swap the current gallery with the new uploaded set.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}