export function Sidebar() {
  const sections = [
    {
      title: "Welcome!",
      links: [
        { text: "Update Journal", href: "/update" },
        { text: "Edit Friends", href: "/friends" },
        { text: "Edit Info", href: "/editinfo" },
        { text: "Change Style", href: "/style" },
      ],
    },
    {
      title: "Find Users",
      links: [
        { text: "Random", href: "/random" },
        { text: "Search", href: "/search" },
        { text: "Directory", href: "/directory" },
      ],
    },
    {
      title: "LiveJournal",
      links: [
        { text: "Recent Entries", href: "/recent" },
        { text: "User Pictures", href: "/pics" },
        { text: "Latest Comments", href: "/comments" },
        { text: "Statistics", href: "/stats" },
      ],
    },
    {
      title: "Help & Support",
      links: [
        { text: "FAQ", href: "/faq" },
        { text: "Support", href: "/support" },
        { text: "Guidelines", href: "/guidelines" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Terms of Service", href: "/tos" },
        { text: "Privacy Policy", href: "/privacy" },
      ],
    },
  ];

  return (
    <div className="w-60 bg-lj-paper p-4 space-y-4">
      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-lj-blue-4 border border-lj-blue-2 rounded"
        >
          <div className="bg-lj-blue-3 px-3 py-2 border-b border-lj-blue-2">
            <h3 className="text-lj-purple font-bold text-sm">
              {section.title}
            </h3>
          </div>
          <div className="p-3 space-y-1">
            {section.links.map((link) => (
              <div key={link.text}>
                <a
                  href={link.href}
                  className="text-lj-blue text-xs hover:text-lj-blue-2 underline"
                >
                  {link.text}
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}