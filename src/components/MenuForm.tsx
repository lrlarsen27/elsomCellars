"use client";

import type { MenuContent, MenuItem, MenuSection } from "@/lib/schema";
import { blankItem, blankSection } from "@/lib/schema";

/**
 * The entire editing surface. Every control is a text input — there is no font
 * picker, no color well, no alignment toggle, because the type doesn't have
 * anywhere to put those values.
 *
 * Adding and removing items is allowed. A menu you can't add a dish to isn't
 * much use, and structure isn't formatting: the template decides how an item
 * looks, the user only decides whether it exists and what it says.
 */

type Props = {
  content: MenuContent;
  onChange: (next: MenuContent) => void;
};

export function MenuForm({ content, onChange }: Props) {
  function updateSection(sectionId: string, patch: Partial<MenuSection>) {
    onChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    });
  }

  function updateItem(sectionId: string, itemId: string, patch: Partial<MenuItem>) {
    onChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id !== sectionId
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            },
      ),
    });
  }

  function addItem(sectionId: string) {
    onChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id !== sectionId
          ? section
          : { ...section, items: [...section.items, blankItem()] },
      ),
    });
  }

  function removeItem(sectionId: string, itemId: string) {
    onChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id !== sectionId
          ? section
          : { ...section, items: section.items.filter((item) => item.id !== itemId) },
      ),
    });
  }

  function addSection() {
    onChange({ ...content, sections: [...content.sections, blankSection()] });
  }

  function removeSection(sectionId: string) {
    onChange({
      ...content,
      sections: content.sections.filter((section) => section.id !== sectionId),
    });
  }

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="menu-title">Title</label>
          <input
            id="menu-title"
            value={content.title}
            onChange={(event) => onChange({ ...content, title: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="menu-subtitle">Subtitle</label>
          <input
            id="menu-subtitle"
            value={content.subtitle}
            onChange={(event) => onChange({ ...content, subtitle: event.target.value })}
          />
        </div>
      </div>

      {content.sections.map((section) => (
        <section
          key={section.id}
          style={{
            border: "1px solid var(--line)",
            borderRadius: 8,
            padding: 16,
            background: "var(--surface)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 14 }}>
            <div style={{ flexGrow: 1 }}>
              <label htmlFor={`section-${section.id}`}>Section</label>
              <input
                id={`section-${section.id}`}
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
              />
            </div>
            <button
              type="button"
              className="subtle"
              onClick={() => removeSection(section.id)}
              style={{ marginBottom: 7 }}
            >
              Remove section
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {section.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gap: 6,
                  paddingTop: 12,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    aria-label="Item name"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(event) =>
                      updateItem(section.id, item.id, { name: event.target.value })
                    }
                  />
                  <input
                    aria-label="Price"
                    placeholder="Price"
                    value={item.price}
                    onChange={(event) =>
                      updateItem(section.id, item.id, { price: event.target.value })
                    }
                    style={{ width: 88, flexShrink: 0 }}
                  />
                  <button
                    type="button"
                    className="subtle"
                    aria-label={`Remove ${item.name || "item"}`}
                    onClick={() => removeItem(section.id, item.id)}
                    style={{ flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
                <textarea
                  aria-label="Description"
                  placeholder="Description"
                  rows={2}
                  value={item.description}
                  onChange={(event) =>
                    updateItem(section.id, item.id, { description: event.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => addItem(section.id)}
            style={{ marginTop: 12, fontSize: 13 }}
          >
            + Add item
          </button>
        </section>
      ))}

      <button type="button" onClick={addSection}>
        + Add section
      </button>

      <div>
        <label htmlFor="menu-footer">Footer</label>
        <textarea
          id="menu-footer"
          rows={2}
          value={content.footer}
          onChange={(event) => onChange({ ...content, footer: event.target.value })}
        />
      </div>
    </div>
  );
}
