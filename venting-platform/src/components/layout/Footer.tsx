// src/components/layout/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-neutral-light dark:bg-dark-card py-6 px-6 mt-10 text-center">
      <p className="text-neutral-darker dark:text-neutral-light">
        © {new Date().getFullYear()} VentSpace. All rights reserved.
      </p>
      <p className="text-sm text-neutral-dark dark:text-neutral-DEFAULT mt-1">
        Remember to be kind and respectful.
      </p>
    </footer>
  );
}
