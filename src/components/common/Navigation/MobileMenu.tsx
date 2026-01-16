import { Link, NavLink as RRNavLink } from "react-router-dom";
import type { NavItem } from "../../../types/navigation";

type MobileMenuProps = {
  isOpen: boolean;
  navItems: NavItem[];
  onClose: () => void;
  onHashClick: (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => void;
};

export default function MobileMenu({
  isOpen,
  navItems,
  onClose,
  onHashClick,
}: MobileMenuProps) {
  return (
    <div
      className={[
        "px-6 md:hidden overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
      ].join(" ")}
    >
      <div className="bg-secondary border-t border-primary">
        <div className="container-custom py-4">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              if (item.type === "route") {
                return (
                  <RRNavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-link block py-3 px-4 rounded-lg hover:bg-tertiary ${
                        isActive ? "active" : ""
                      }`
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
                  className="nav-link block py-3 px-4 rounded-lg hover:bg-tertiary"
                >
                  {item.label}
                </a>
              );
            })}

            <RRNavLink
              to="/login"
              onClick={onClose}
              className="nav-link block py-3 px-4 rounded-lg hover:bg-tertiary"
            >
              Se connecter
            </RRNavLink>

            <Link
              to="/contact"
              onClick={onClose}
              className="btn-primary w-full mt-4"
            >
              Nous rejoindre
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
