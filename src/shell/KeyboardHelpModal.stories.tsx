import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { KeyboardHelpModal } from "./KeyboardHelpModal";

const meta = {
  title: "Shell/KeyboardHelpModal",
  component: KeyboardHelpModal,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof KeyboardHelpModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
  },
};

export const Closed: Story = {
  args: {
    open: false,
  },
};

export const Interactive: Story = {
  render: function InteractiveStory(args) {
    const [open, setOpen] = useState(true);

    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            margin: "1rem",
            padding: "0.5rem 0.85rem",
            font: "inherit",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          Abrir ayuda
        </button>
        <KeyboardHelpModal
          {...args}
          open={open}
          onClose={() => {
            setOpen(false);
            args.onClose();
          }}
        />
      </>
    );
  },
};
