"use client";

const footerLinks = [
  { label: "Início", href: "#home" },
  { label: "Fluxo", href: "#fluxo" },
  { label: "Documentos", href: "#documentos" },
  { label: "Deploy", href: "#deploy" },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#d9dde3] bg-white px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="heading-4 text-[#1A1A1A]">FredTamashiro</p>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#666666]">
            SmartDocs AI é uma demonstração técnica de ingestão inteligente,
            busca semântica e consulta de documentos com IA aplicada a um fluxo
            real de produto.
          </p>
          <p className="mt-4 text-xs text-[#666666]">
            © {currentYear} Fred Tamashiro. Projeto em evolução contínua.
          </p>
        </div>

        <div className="grid gap-6 md:justify-items-end">
          <nav aria-label="Links do rodapé" className="flex flex-wrap gap-4 text-sm">
            {footerLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[#2F6F6D] transition hover:text-[#1A1A1A]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/fredtamashiro"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub de Fred Tamashiro"
              className="inline-flex items-center rounded-md border border-[#d9dde3] bg-[#F7F8FA] px-4 py-2 text-sm font-medium text-[#2F6F6D] transition hover:border-[#2F6F6D] hover:text-[#1A1A1A]"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/fredtamashiro/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn de Fred Tamashiro"
              className="inline-flex items-center rounded-md border border-[#d9dde3] bg-[#F7F8FA] px-4 py-2 text-sm font-medium text-[#2F6F6D] transition hover:border-[#2F6F6D] hover:text-[#1A1A1A]"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
