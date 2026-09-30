import React from "react";
import { buttonClasses, type ButtonStyle } from "./buttonClasses";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle;

export default function Button({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
