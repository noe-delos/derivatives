"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Écrivez votre contenu...",
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.configure({
        keepMarks: true,
        keepAttributes: true,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: true,
      }),
      ListItem,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty:text-muted",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL du lien:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div
      className={`prose prose-sm max-w-none bg-background rounded-xl border border-input shadow-soft transition-shadow hover:shadow-soft-md ${className}`}
      onClick={() => editor.commands.focus()}
    >
      <div className="border-b p-1 flex flex-wrap items-center gap-1 rounded-t-xl bg-muted/50">
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          className="h-7"
        >
          <Bold className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          className="h-7"
        >
          <Italic className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          className="h-7"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          className="h-7"
        >
          <Code className="h-3.5 w-3.5" />
        </Toggle>
        <Separator orientation="vertical" className="h-5" />
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          className="h-7"
        >
          <List className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          className="h-7"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          className="h-7"
        >
          <Quote className="h-3.5 w-3.5" />
        </Toggle>
        <Separator orientation="vertical" className="h-5" />
        <Button
          size="sm"
          variant="ghost"
          onClick={addLink}
          className="h-7 px-2"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-7 px-2"
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-7 px-2"
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-5 min-h-[120px] focus:outline-none focus:ring-0 bg-transparent [&_.is-editor-empty]:text-muted/50 [&_*]:font-normal [&_p]:leading-relaxed [&_.ProseMirror]:outline-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:focus:ring-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-6"
      />
    </div>
  );
}
