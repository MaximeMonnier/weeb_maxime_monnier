import { NavLink as RRNavLink } from "react-router-dom";
import type { NavItem } from "../../../types/navigation";

type DesktopNavProps = {
  navItems: NavItem[];
  onHashClick: (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => void;
};

export default function DesktopNav({ navItems, onHashClick }: DesktopNavProps) {
  return (
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => {
        if (item.type === "route") {
          return (
            <RRNavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {item.label}
            </RRNavLink>
          );
        }

        return (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => onHashClick(e, item.href)}
            className="nav-link"
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
