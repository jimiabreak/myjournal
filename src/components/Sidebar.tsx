import { UserSidebar } from './UserSidebar';
import { Calendar } from './Calendar';

export function Sidebar() {
  const sections = [
    {
      title: "Navigation",
      links: [
        { text: "Recent Entries", href: "/journal" },
        { text: "Random User", href: "/random" },
        { text: "Search Users", href: "/search" },
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
    <div className="lj-sidebar">
      <UserSidebar />
      <Calendar />
      {sections.map((section) => (
        <div key={section.title} className="lj-box">
          <div className="lj-box-header">
            {section.title}
          </div>
          <div className="lj-box-content">
            {section.links.map((link) => (
              <div key={link.text} className="mb-1">
                <a href={link.href} className="text-tiny break-words">
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