export function isAuthPublicPath(pathname) {
  return (
    pathname === "/login" ||
    pathname === "/recuperar-senha" ||
    pathname === "/redefinir-senha" ||
    pathname === "/trocar-senha-inicial"
  );
}

const ALWAYS_ALLOWED_AUTHENTICATED_PATHS = ["/alterar-senha"];

export function collectAllowedPaths(menu) {
  const paths = [];

  for (const item of menu ?? []) {
    if (item?.path) {
      paths.push(item.path);
    }

    for (const child of item?.children ?? []) {
      if (child?.path) {
        paths.push(child.path);
      }
    }
  }

  return paths;
}

export function isPathAllowed(pathname, menu) {
  const normalized = pathname.replace(/\/+$/, "") || "/";

  if (ALWAYS_ALLOWED_AUTHENTICATED_PATHS.includes(normalized)) {
    return true;
  }
  const allowed = collectAllowedPaths(menu);

  if (allowed.length === 0) {
    return false;
  }

  return allowed.some((path) => {
    const base = path.replace(/\/+$/, "") || "/";
    if (base === "/") {
      return normalized === "/";
    }

    return normalized === base || normalized.startsWith(`${base}/`);
  });
}

export function getFirstAllowedPath(menu) {
  if (!Array.isArray(menu) || menu.length === 0) {
    return "/";
  }

  for (const item of menu) {
    if (item?.path) {
      return item.path;
    }

    const children = Array.isArray(item?.children) ? item.children : [];
    for (const child of children) {
      if (child?.path) {
        return child.path;
      }
    }
  }

  return "/";
}

