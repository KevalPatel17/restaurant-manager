import { Link } from 'react-router-dom';

export default function Logo({ className = '', isLink = true, text = 'Musafir Cafe' }) {
  const content = (
    <div className={`inline-flex items-center group transition-all duration-300 ${className}`}>
      <span
        style={{ fontFamily: "'Lobster', cursive" }}
        className="font-lobster text-3xl md:text-[34px] text-white tracking-wide select-none transition-transform duration-300 group-hover:scale-105 leading-none"
      >
        {text}
      </span>
    </div>
  );

  if (isLink) {
    return (
      <Link to="/" aria-label={`${text} Home`} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
