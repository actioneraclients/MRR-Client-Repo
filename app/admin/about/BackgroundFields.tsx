"use client"

const LABEL_CLASS = "block text-xs font-medium text-slate-600 mb-1"

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded p-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function BackgroundFields({
  section,
  updateRoot,
}: {
  section: any
  updateRoot: (field: string, value: any) => void
}) {
  const mode = section?.background_mode || "default"
  const color = section?.background_color || "#f7f4ef"

  return (
    <div className="border-t pt-4 mt-4">
      <SelectField
        label="Background Mode"
        value={mode}
        onChange={(v) => updateRoot("background_mode", v)}
        options={[
          { value: "default", label: "Transparent" },
          { value: "white", label: "White" },
          { value: "brand_background", label: "Brand Background" },
          { value: "brand_primary", label: "Brand Primary" },
          { value: "brand_accent", label: "Brand Accent" },
          { value: "custom", label: "Custom" },
        ]}
      />
      {mode === "custom" && (
        <div className="mt-2">
          <label className={LABEL_CLASS}>Background Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => updateRoot("background_color", e.target.value)}
              className="h-10 w-14 p-1 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => updateRoot("background_color", e.target.value)}
              placeholder="#ffffff"
              className="flex-1 border rounded p-2 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
