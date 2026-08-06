"use client";

import type { MenuBlock, MenuContent, MenuItem, DietaryTag } from "@/lib/schema";
import { DIETARY_TAGS, DIETARY_TAG_LABELS, blankItem, blankSection } from "@/lib/schema";

/**
 * The entire editing surface.
 *
 * Every control is a text field or a tag toggle. There is no font picker, no
 * color well, no column chooser — the schema has nowhere to put those values,
 * so there is nothing to expose.
 *
 * Reordering blocks is allowed and is the only lever over layout: blocks flow
 * into columns in order. Moving a section up or down changes where it lands,
 * but can't put the page in a broken state.
 */

type Props = {
  content: MenuContent;
  onChange: (next: MenuContent) => void;
};

export function MenuForm({ content, onChange }: Props) {
  function replaceBlock(blockId: string, next: MenuBlock) {
    onChange({
      ...content,
      blocks: content.blocks.map((block) => (block.id === blockId ? next : block)),
    });
  }

  function removeBlock(blockId: string) {
    onChange({ ...content, blocks: content.blocks.filter((block) => block.id !== blockId) });
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const index = content.blocks.findIndex((block) => block.id === blockId);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= content.blocks.length) return;

    const blocks = [...content.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    onChange({ ...content, blocks });
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <div>
        <label htmlFor="menu-season">Season label</label>
        <input
          id="menu-season"
          value={content.season}
          onChange={(event) => onChange({ ...content, season: event.target.value })}
        />
      </div>

      {content.blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          isFirst={index === 0}
          isLast={index === content.blocks.length - 1}
          onChange={(next) => replaceBlock(block.id, next)}
          onRemove={() => removeBlock(block.id)}
          onMove={(direction) => moveBlock(block.id, direction)}
        />
      ))}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => onChange({ ...content, blocks: [...content.blocks, blankSection()] })}
        >
          + Add section
        </button>
      </div>

      <div style={{ display: "grid", gap: 12, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
        <div>
          <label htmlFor="menu-disclaimer">Footer — disclaimer</label>
          <textarea
            id="menu-disclaimer"
            rows={2}
            value={content.disclaimer}
            onChange={(event) => onChange({ ...content, disclaimer: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="menu-service">Footer — service charge</label>
          <textarea
            id="menu-service"
            rows={2}
            value={content.serviceCharge}
            onChange={(event) => onChange({ ...content, serviceCharge: event.target.value })}
          />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          The dietary legend line is part of the design and isn&apos;t editable here.
        </p>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  block: MenuBlock;
  isFirst: boolean;
  isLast: boolean;
  onChange: (next: MenuBlock) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: 16,
        background: "var(--surface)",
      }}
    >
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", marginBottom: 14 }}>
        <div style={{ flexGrow: 1 }}>
          <label htmlFor={`block-${block.id}`}>
            {block.kind === "note" ? "Note heading" : "Section"}
          </label>
          <input
            id={`block-${block.id}`}
            value={block.kind === "note" ? block.heading : block.title}
            onChange={(event) =>
              onChange(
                block.kind === "note"
                  ? { ...block, heading: event.target.value }
                  : { ...block, title: event.target.value },
              )
            }
          />
        </div>
        <button
          type="button"
          className="subtle"
          onClick={() => onMove(-1)}
          disabled={isFirst}
          aria-label="Move up"
          style={{ marginBottom: 7 }}
        >
          ↑
        </button>
        <button
          type="button"
          className="subtle"
          onClick={() => onMove(1)}
          disabled={isLast}
          aria-label="Move down"
          style={{ marginBottom: 7 }}
        >
          ↓
        </button>
        <button type="button" className="subtle" onClick={onRemove} style={{ marginBottom: 7 }}>
          Remove
        </button>
      </div>

      {block.kind === "note" ? (
        <textarea
          aria-label="Note text"
          rows={3}
          value={block.body}
          onChange={(event) => onChange({ ...block, body: event.target.value })}
        />
      ) : (
        <>
          <div style={{ display: "grid", gap: 14 }}>
            {block.items.map((item) => (
              <ItemEditor
                key={item.id}
                item={item}
                onChange={(next) =>
                  onChange({
                    ...block,
                    items: block.items.map((candidate) =>
                      candidate.id === item.id ? next : candidate,
                    ),
                  })
                }
                onRemove={() =>
                  onChange({
                    ...block,
                    items: block.items.filter((candidate) => candidate.id !== item.id),
                  })
                }
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...block, items: [...block.items, blankItem()] })}
            style={{ marginTop: 12, fontSize: 13 }}
          >
            + Add item
          </button>
        </>
      )}
    </section>
  );
}

function ItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: MenuItem;
  onChange: (next: MenuItem) => void;
  onRemove: () => void;
}) {
  function toggleTag(tag: DietaryTag) {
    const tags = item.tags.includes(tag)
      ? item.tags.filter((candidate) => candidate !== tag)
      : [...item.tags, tag];
    onChange({ ...item, tags });
  }

  return (
    <div style={{ display: "grid", gap: 6, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          aria-label="Item name"
          placeholder="Item name"
          value={item.name}
          onChange={(event) => onChange({ ...item, name: event.target.value })}
        />
        <input
          aria-label="Price"
          placeholder="Price"
          value={item.price}
          onChange={(event) => onChange({ ...item, price: event.target.value })}
          style={{ width: 78, flexShrink: 0 }}
        />
        <button
          type="button"
          className="subtle"
          aria-label={`Remove ${item.name || "item"}`}
          onClick={onRemove}
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
        onChange={(event) => onChange({ ...item, description: event.target.value })}
      />

      <input
        aria-label="Add-on"
        placeholder="Add-on, e.g. - add grilled chicken +$6 (printed in bold)"
        value={item.addOn}
        onChange={(event) => onChange({ ...item, addOn: event.target.value })}
      />

      <input
        aria-label="Pairing"
        placeholder="Pairing, e.g. Pairs with 2024 Albarino"
        value={item.pairing}
        onChange={(event) => onChange({ ...item, pairing: event.target.value })}
      />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
          Dietary
        </span>
        {DIETARY_TAGS.map((tag) => {
          const active = item.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={active}
              style={{
                padding: "2px 8px",
                fontSize: 12,
                background: active ? "var(--ink)" : "var(--surface)",
                color: active ? "#fff" : "var(--muted)",
                borderColor: active ? "var(--ink)" : "var(--line)",
              }}
            >
              {DIETARY_TAG_LABELS[tag]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
