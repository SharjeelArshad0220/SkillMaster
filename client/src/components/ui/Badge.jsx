const variants = {
  learning:      "bg-accent/10 text-accent",
  revision:      "bg-warn/10 text-warn",
  exam:          "bg-fail/10 text-fail",
  current:       "bg-accent/10 text-accent",
  locked:        "bg-divider text-muted",
  passed:        "bg-pass/10 text-pass",
  failed:        "bg-fail/10 text-fail",
  "needs-revision": "bg-warn/10 text-warn",
};

export default function Badge({ variant = "locked", children }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${variants[variant] || variants.locked}
    `}>
      {children}
    </span>
  );
}
