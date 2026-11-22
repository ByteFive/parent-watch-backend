export function canViewLocation(viewer, target) {
  if (String(viewer._id) === String(target._id)) {
    return true;
  }

  if (viewer.role !== "parent") {
    return false;
  }

  return viewer.children.some((childId) => String(childId) === String(target._id));
}