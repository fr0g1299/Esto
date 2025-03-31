import React, { useRef } from "react";
import "./RippleButton.css";

interface RippleButtonProps {
  onClick?: () => void;
  icon: React.ReactNode;
  className?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  onClick,
  icon,
  className,
}) => {
  const rippleRef = useRef<HTMLDivElement>(null);

  const createRipple = () => {
    const ripple = document.createElement("span");
    ripple.className = "ripple";

    const button = rippleRef.current!;
    const rect = button.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;

    // Force center origin
    const x = button.offsetWidth / 2 - size / 2;
    const y = button.offsetHeight / 2 - size / 2;

    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);

    onClick?.();
  };

  return (
    <div
      className={`${className || ""}`}
      onClick={createRipple}
      ref={rippleRef}
    >
      {icon}
    </div>
  );
};

export default RippleButton;
