import Link from 'next/link';
import React from 'react'

const SocialLink = () => {
  return (
    <>
      <ul className="fixed-social-icon">
        <li>
          <Link href="#">
            <img className="dark:block hidden " src="../linkedin-dark.svg" />
            <img className="dark:hidden " src="../linked-in-white.svg" />
          </Link>
        </li>
        <li>
          <Link href="#">
            <img className="dark:block hidden " src="../facebook-dark.svg" />
            <img className="dark:hidden " src="../facebook-white.svg" />
          </Link>
        </li>
        <li>
          <Link href="#">
            <img className="dark:block hidden " src="../instagram-dark.svg" />
            <img className="dark:hidden " src="../instagram-white.svg" />
          </Link>
        </li>
      </ul>
    </>
  );
}

export default SocialLink