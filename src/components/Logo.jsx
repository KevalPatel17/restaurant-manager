import { Link } from 'react-router-dom';
import logoImg from '../assets/images/newlg.png';

export default function Logo({
  className = '',
  isLink = true,
  text = 'Musafir Cafe',
  showImage = true,
  imgSize = 'w-10 h-10 md:w-11 md:h-11',
}) {
  const content = (
    <div className={`inline-flex items-center gap-3 group transition-all duration-300 ${className}`}>
      {showImage && (
        <img
          src={logoImg}
          alt="Musafir Cafe Logo"
          className={`${imgSize} rounded-full object-cover shadow-md border border-white/20 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 shrink-0`}
        />
      )}
      {text && (
        <span
          style={{ fontFamily: "'Lobster', cursive" }}
          className="font-lobster text-2xl sm:text-3xl md:text-[32px] text-white tracking-wide select-none transition-transform duration-300 group-hover:scale-102 leading-none whitespace-nowrap"
        >
          {text}
        </span>
      )}
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
