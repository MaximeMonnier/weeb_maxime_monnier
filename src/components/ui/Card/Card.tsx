import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverable?: boolean;
  fullWidth?: boolean;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const Card = ({
  children,
  hoverable = false,
  fullWidth = true,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={cx(
        "card",
        hoverable && "card-hover",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
