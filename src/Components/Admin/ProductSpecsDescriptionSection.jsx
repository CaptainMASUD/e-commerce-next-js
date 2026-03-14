"use client";

import React from "react";
import { FolderTree, FileText, Plus, Trash2, ListTree } from "lucide-react";

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
            <span className="text-[12px] font-semibold tracking-wide" style={{ color: PALETTE.navy }}>
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

function Textarea({ className, rows = 4, PALETTE, FONT_STACK, ...props }) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={cx("w-full bg-transparent outline-none resize-none text-sm font-medium", className)}
      style={{ color: PALETTE.navy, fontFamily: FONT_STACK }}
    />
  );
}

function Chip({ children, PALETTE }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: `1px solid ${PALETTE.border}`,
        color: PALETTE.navy,
      }}
    >
      {children}
    </span>
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

export default function ProductSpecsDescriptionSection({
  form,
  highlightedSpecsPreview,
  summary,
  sectionBusy,
  saveSpecificationsSection,
  saveDescriptionSection,
  updateSpecGroup,
  addSpecGroup,
  removeSpecGroup,
  addSpecToGroup,
  updateSpec,
  removeSpec,
  updateDescription,
  setField,
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
            icon={FolderTree}
            title="Specifications by Group"
            subtitle="Grouped specifications. Highlighted specs also become highlights."
            FONT_STACK={FONT_STACK}
            PALETTE={PALETTE}
            right={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addSpecGroup}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Group
                </button>

                <button
                  type="button"
                  onClick={saveSpecificationsSection}
                  disabled={sectionBusy.specifications}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
                  style={{
                    background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                    minHeight: 42,
                  }}
                >
                  Save Specifications
                </button>
              </div>
            }
          />

          <div className="mt-6">
            <Divider />
          </div>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              <PreviewTile
                label="Total specs"
                value={String(summary?.totalSpecifications ?? 0)}
                PALETTE={PALETTE}
              />
              <PreviewTile
                label="Highlighted specs"
                value={String(highlightedSpecsPreview.length)}
                PALETTE={PALETTE}
              />
              <PreviewTile
                label="Groups"
                value={String(safeArray(form?.specGroups).length)}
                PALETTE={PALETTE}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {highlightedSpecsPreview.length ? (
                highlightedSpecsPreview.map((item, i) => (
                  <Chip key={item + i} PALETTE={PALETTE}>
                    {item}
                  </Chip>
                ))
              ) : (
                <div className="text-[12px] font-medium" style={{ color: PALETTE.muted }}>
                  No highlighted specs yet.
                </div>
              )}
            </div>
          </div>

          <div className="my-6">
            <Divider />
          </div>

          <div className="space-y-4">
            {safeArray(form?.specGroups).map((group, groupIndex) => (
              <div
                key={group.id}
                className="rounded-[24px] p-4"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: `1px solid ${PALETTE.border}`,
                  boxShadow: "0 12px 30px rgba(0,31,63,0.06)",
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                      style={{
                        background: PALETTE.soft,
                        border: `1px solid ${PALETTE.border}`,
                        color: PALETTE.navy,
                      }}
                    >
                      Group #{groupIndex + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSpecGroup(group.id)}
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                    style={{
                      background: "rgba(255,107,107,0.14)",
                      border: "1px solid rgba(255,107,107,0.25)",
                      color: PALETTE.navy,
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove group
                  </button>
                </div>

                <div className="mt-4">
                  <Field label="Group name" required icon={ListTree} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                    <Input
                      PALETTE={PALETTE}
                      FONT_STACK={FONT_STACK}
                      value={group.name}
                      onChange={(e) => updateSpecGroup(group.id, { name: e.target.value })}
                      placeholder="Display"
                    />
                  </Field>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip PALETTE={PALETTE}>
                    Group: {String(group.name || "").trim() || `Group ${groupIndex + 1}`}
                  </Chip>
                  <Chip PALETTE={PALETTE}>Specs: {safeArray(group.specs).length}</Chip>
                </div>

                <div className="mt-5">
                  <Divider />
                </div>

                <div className="mt-5 space-y-3">
                  {safeArray(group.specs).map((spec, specIndex) => (
                    <div
                      key={spec.id}
                      className="rounded-[20px] p-4"
                      style={{
                        background: PALETTE.soft2,
                        border: `1px solid ${PALETTE.border}`,
                      }}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-2xl px-3 py-2 text-[12px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.92)",
                              border: `1px solid ${PALETTE.border}`,
                              color: PALETTE.navy,
                            }}
                          >
                            Spec #{specIndex + 1}
                          </span>

                          <label
                            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2"
                            style={{ background: "rgba(255,255,255,0.92)", border: `1px solid ${PALETTE.border}` }}
                          >
                            <span className="text-[12px] font-medium" style={{ color: PALETTE.navy }}>
                              Highlight
                            </span>
                            <input
                              type="checkbox"
                              checked={Boolean(spec.isHighlighted)}
                              onChange={(e) =>
                                updateSpec(group.id, spec.id, { isHighlighted: e.target.checked })
                              }
                            />
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeSpec(group.id, spec.id)}
                          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                          style={{
                            background: "rgba(255,107,107,0.14)",
                            border: "1px solid rgba(255,107,107,0.25)",
                            color: PALETTE.navy,
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                          <Field label="Label" required hideIcon FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                            <Input
                              PALETTE={PALETTE}
                              FONT_STACK={FONT_STACK}
                              value={spec.label}
                              onChange={(e) => updateSpec(group.id, spec.id, { label: e.target.value })}
                              placeholder="Screen Size"
                            />
                          </Field>
                        </div>

                        <div className="lg:col-span-8">
                          <Field label="Value" required hideIcon FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                            <Input
                              PALETTE={PALETTE}
                              FONT_STACK={FONT_STACK}
                              value={spec.value}
                              onChange={(e) => updateSpec(group.id, spec.id, { value: e.target.value })}
                              placeholder="6.1-inch Super Retina XDR"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => addSpecToGroup(group.id)}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
                      style={{
                        background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add spec
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            icon={FileText}
            title="Description Blocks"
            subtitle="Structured content sections for the product details area."
            FONT_STACK={FONT_STACK}
            PALETTE={PALETTE}
            right={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setField("description", [
                      ...safeArray(form?.description),
                      {
                        id: crypto.randomUUID?.() || String(Date.now()),
                        title: "",
                        details: "",
                        order: safeArray(form?.description).length,
                      },
                    ])
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    border: `1px solid ${PALETTE.border}`,
                    color: PALETTE.navy,
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>

                <button
                  type="button"
                  onClick={saveDescriptionSection}
                  disabled={sectionBusy.description}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-white text-sm font-semibold"
                  style={{
                    background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.navy2} 100%)`,
                    minHeight: 42,
                  }}
                >
                  Save Description
                </button>
              </div>
            }
          />

          <div className="mt-6">
            <Divider />
          </div>

          <div className="mt-6 space-y-3">
            {safeArray(form?.description).map((b, idx) => (
              <div
                key={b.id}
                className="rounded-[24px] p-4"
                style={{
                  background: "rgba(255,255,255,0.92)",
                  border: `1px solid ${PALETTE.border}`,
                }}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-4">
                    <Field label="Title" icon={FileText} FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Input
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        value={b.title}
                        onChange={(e) => updateDescription(b.id, { title: e.target.value })}
                        placeholder="Overview"
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-7">
                    <Field label="Details" icon={FileText} multiline FONT_STACK={FONT_STACK} PALETTE={PALETTE}>
                      <Textarea
                        PALETTE={PALETTE}
                        FONT_STACK={FONT_STACK}
                        rows={4}
                        value={b.details}
                        onChange={(e) => updateDescription(b.id, { details: e.target.value })}
                        placeholder="Write details..."
                      />
                    </Field>
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "description",
                          safeArray(form?.description)
                            .filter((x) => x.id !== b.id)
                            .map((x, i) => ({ ...x, order: i }))
                        )
                      }
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

                <div className="mt-3 text-[11px] font-medium" style={{ color: PALETTE.muted }}>
                  Order: {idx}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}