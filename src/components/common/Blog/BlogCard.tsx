import type { ReactNode } from "react";
import Card from "../../ui/Card/Card";
import SectionTitle from "../../ui/Title/SecondTitle";

type BlogCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

const BlogCard = ({
  title,
  description,
  children,
  footer,
  className,
}: BlogCardProps) => {
  return (
    <Card className={cx("max-w-3xl", className)}>
      <div className="space-y-6">
        <div className="space-y-2">
          <SectionTitle
            line1={title}
            as="h2"
            align="left"
            size="md"
            className="text-2xl sm:text-3xl"
          />
          {description ? (
            <p className="text-sm text-[var(--color-light-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>

        <div>{children}</div>

        {footer ? <div className="pt-2">{footer}</div> : null}
      </div>
    </Card>
  );
};

export default BlogCard;
