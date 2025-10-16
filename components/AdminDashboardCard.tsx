// components/DashboardCard.tsx
import React from "react";
import { motion } from "framer-motion";

type Props = {
  title: string;
  icon: React.ReactNode;
  description?: string;
  count?: number | string;
  color?: string;
  href?: string;
  onClick?: () => void;
};

export default function DashboardCard({
  title,
  icon,
  description,
  count,
  color = "#DAA520",
  href,
  onClick,
}: Props) {
  const content = (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-transparent hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 p-5 flex flex-col items-center gap-3 text-center cursor-pointer"
      title={description}
      onClick={onClick}
    >
      <div
        className="p-3 rounded-full bg-opacity-10"
        style={{ color, backgroundColor: `${color}15` }}
      >
        <div className="text-2xl" aria-hidden>
          {icon}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>

      {count !== undefined && (
        <div className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700">
          <span className="font-medium text-lg text-gray-900 dark:text-gray-50">{count}</span>
        </div>
      )}

      {description && <p className="text-xs text-gray-500 dark:text-gray-300">{description}</p>}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}