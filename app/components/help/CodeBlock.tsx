interface CodeBlockProps {
  children: string;
}

export default function CodeBlock({ children }: CodeBlockProps) {
  return (
    <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm">
      <code className="text-blue-300 font-mono whitespace-pre">
        {children}
      </code>
    </pre>
  );
}
