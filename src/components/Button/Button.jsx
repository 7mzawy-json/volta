import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  to,
  href,
  type = 'button',
  className = '',
  fullWidth = false,
  children,
  ...rest
}) {
  const classes = `${styles.btn} ${styles[variant]} ${fullWidth ? styles.full : ''} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
