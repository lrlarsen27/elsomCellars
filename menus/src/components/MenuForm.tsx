"use client";

import type { MenuBlock, MenuContent, MenuItem, DietaryTag } from "@/lib/schema";
import { DIETARY_TAGS, DIETARY_TAG_LABELS, blankItem, blankSection } from "@/lib/schema";
import {
  AddIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  CheckIcon,
  CloseIcon,
  DeleteIcon,
  NotesIcon,
  ViewColumnIcon,
} from "@/components/Icon";

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
  /** Block id → which column(s) it lands in. Read-only feedback. */
  placement: Record<string, string>;
};

export function MenuForm({ content, onChange, placement }: Props) {
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
    <div style={{ display: "grid", gap: 16 }}>
      <div className="md-card" style={{ padding: 20 }}>
        <p className="md-label-small md-on-surface-variant" style={{ marginBottom: 16 }}>
          Header
        </p>
        <div className="md-field">
          <input
            id="menu-season"
            placeholder=" "
            value={content.season}
            onChange={(event) => onChange({ ...content, season: event.target.value })}
          />
          <label htmlFor="menu-season">Season label</label>
        </div>
      </div>

      {content.blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          placement={placement[block.id]}
          isFirst={index === 0}
          isLast={index === content.blocks.length - 1}
          onChange={(next) => replaceBlock(block.id, next)}
          onRemove={() => removeBlock(block.id)}
          onMove={(direction) => moveBlock(block.id, direction)}
        />
      ))}

      <div>
        <button
          type="button"
          className="md-button tonal"
          onClick={() => onChange({ ...content, blocks: [...content.blocks, blankSection()] })}
        >
          <AddIcon />
          <span>Add section</span>
        </button>
      </div>

      <div className="md-card" style={{ display: "grid", gap: 16, padding: 20 }}>
        <p className="md-label-small md-on-surface-variant">Footer</p>
        <div className="md-field">
          <textarea
            id="menu-disclaimer"
            rows={2}
            placeholder=" "
            value={content.disclaimer}
            onChange={(event) => onChange({ ...content, disclaimer: event.target.value })}
          />
          <label htmlFor="menu-disclaimer">Disclaimer</label>
        </div>
        <div className="md-field">
          <textarea
            id="menu-service"
            rows={2}
            placeholder=" "
            value={content.serviceCharge}
            onChange={(event) => onChange({ ...content, serviceCharge: event.target.value })}
          />
          <label htmlFor="menu-service">Service charge</label>
        </div>
        <p className="md-body-small md-on-surface-variant">
          The dietary legend line is part of the design and isn&apos;t editable here.
        </p>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  placement,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  block: MenuBlock;
  placement?: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (next: MenuBlock) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const isNote = block.kind === "note";

  return (
    <section className="md-card" style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* Where this lands on the sheet — read-only, recomputed as you type. */}
        {placement ? (
          <span className="md-chip assist">
            <ViewColumnIcon size="sm" />
            <span>{placement}</span>
          </span>
        ) : null}

        {isNote ? (
          <span className="md-chip assist" style={{ background: "var(--md-sys-color-secondary-container)", color: "var(--md-sys-color-on-secondary-container)" }}>
            <NotesIcon size="sm" />
            <span>Note</span>
          </span>
        ) : null}

        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            type="button"
            className="md-icon-button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            aria-label="Move section up"
            title="Move up"
          >
            <ArrowUpwardIcon />
          </button>
          <button
            type="button"
            className="md-icon-button"
            onClick={() => onMove(1)}
            disabled={isLast}
            aria-label="Move section down"
            title="Move down"
          >
            <ArrowDownwardIcon />
          </button>
          <button
            type="button"
            className="md-icon-button danger"
            onClick={onRemove}
            aria-label="Remove section"
            title="Remove section"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="md-field">
        <input
          id={`block-${block.id}`}
          placeholder=" "
          value={block.kind === "note" ? block.heading : block.title}
          onChange={(event) =>
            onChange(
              block.kind === "note"
                ? { ...block, heading: event.target.value }
                : { ...block, title: event.target.value },
            )
          }
        />
        <label htmlFor={`block-${block.id}`}>
          {block.kind === "note" ? "Note heading" : "Section title"}
        </label>
      </div>

      {block.kind === "note" ? (
        <div className="md-field" style={{ marginTop: 16 }}>
          <textarea
            id={`note-body-${block.id}`}
            rows={4}
            placeholder=" "
            value={block.body}
            onChange={(event) => onChange({ ...block, body: event.target.value })}
          />
          <label htmlFor={`note-body-${block.id}`}>Note text</label>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {block.items.map((item, index) => (
              <ItemEditor
                key={item.id}
                item={item}
                index={index}
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
            className="md-button text"
            onClick={() => onChange({ ...block, items: [...block.items, blankItem()] })}
            style={{ marginTop: 12 }}
          >
            <AddIcon />
            <span>Add item</span>
          </button>
        </>
      )}
    </section>
  );
}

function ItemEditor({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: MenuItem;
  index: number;
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
    <div
      style={{
        // Items nest one surface level up from the card they sit in, so the
        // group reads as a unit without another border inside a border.
        ["--md-field-bg" as string]: "var(--md-sys-color-surface-container-low)",
        display: "grid",
        gap: 12,
        padding: 12,
        borderRadius: "var(--md-sys-shape-corner-small)",
        background: "var(--md-sys-color-surface-container-low)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="md-field dense" style={{ flexGrow: 1 }}>
          <input
            id={`item-name-${item.id}`}
            placeholder=" "
            value={item.name}
            onChange={(event) => onChange({ ...item, name: event.target.value })}
          />
          <label htmlFor={`item-name-${item.id}`}>Item {index + 1}</label>
        </div>
        <div className="md-field dense" style={{ width: 96, flexShrink: 0 }}>
          <input
            id={`item-price-${item.id}`}
            placeholder=" "
            value={item.price}
            onChange={(event) => onChange({ ...item, price: event.target.value })}
          />
          <label htmlFor={`item-price-${item.id}`}>Price</label>
        </div>
        <button
          type="button"
          className="md-icon-button danger"
          aria-label={`Remove ${item.name || `item ${index + 1}`}`}
          title="Remove item"
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="md-field dense">
        <textarea
          id={`item-description-${item.id}`}
          rows={2}
          placeholder=" "
          value={item.description}
          onChange={(event) => onChange({ ...item, description: event.target.value })}
        />
        <label htmlFor={`item-description-${item.id}`}>Description</label>
      </div>

      <div>
        <div className="md-field dense">
          <input
            id={`item-addon-${item.id}`}
            placeholder=" "
            value={item.addOn}
            onChange={(event) => onChange({ ...item, addOn: event.target.value })}
          />
          <label htmlFor={`item-addon-${item.id}`}>Add-on</label>
        </div>
        <p className="md-body-small md-on-surface-variant" style={{ margin: "4px 12px 0" }}>
          Printed in bold after the description, e.g. “– add grilled chicken +$6”.
        </p>
      </div>

      <div>
        <div className="md-field dense">
          <input
            id={`item-pairing-${item.id}`}
            placeholder=" "
            value={item.pairing}
            onChange={(event) => onChange({ ...item, pairing: event.target.value })}
          />
          <label htmlFor={`item-pairing-${item.id}`}>Pairing</label>
        </div>
        <p className="md-body-small md-on-surface-variant" style={{ margin: "4px 12px 0" }}>
          Its own line when present, e.g. “Pairs with 2024 Albarino”.
        </p>
      </div>

      <fieldset style={{ margin: 0, padding: 0, border: "none" }}>
        <legend
          className="md-label-small md-on-surface-variant"
          style={{ padding: 0, marginBottom: 8 }}
        >
          Dietary
        </legend>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DIETARY_TAGS.map((tag) => {
            const active = item.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className="md-chip"
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
              >
                {active ? <CheckIcon size="sm" /> : null}
                <span>{DIETARY_TAG_LABELS[tag]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
