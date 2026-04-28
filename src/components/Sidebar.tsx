type SidebarProps = {
  sections: string[];
  activeSection: string;
  onSelect: (section: string) => void;
};

export function Sidebar({ sections, activeSection, onSelect }: SidebarProps) {
  return (
    <aside className="w-full bg-slate-900 text-slate-100 lg:min-h-screen lg:w-72">
      <div className="border-b border-slate-700 px-6 py-5">
        <h1 className="text-lg font-bold">Sistema de Riesgo de Desercion</h1>
        <p className="mt-1 text-sm text-slate-300">Dashboard academico para tesis</p>
      </div>

      <nav className="space-y-1 p-4">
        {sections.map((section) => {
          const isActive = section === activeSection;
          return (
            <button
              key={section}
              onClick={() => onSelect(section)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                isActive
                  ? "bg-slate-700 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              type="button"
            >
              {section}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
