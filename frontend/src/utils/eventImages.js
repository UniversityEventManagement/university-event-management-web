const CATEGORY_IMAGE_MAP = {
  workshop: '/img/workshop.jpg',
  cultural: '/img/cultural.jpg',
  technical: '/img/technical.jpeg',
  sports: '/img/sports.jpg',
  other: '/img/other.jpg',
  seminar: '/img/annual-fest.jpg',
};

export const getEventCardImage = (event) => {
  if (event?.image_url && String(event.image_url).trim()) {
    return event.image_url;
  }

  const title = String(event?.title || '').toLowerCase();
  if (title.includes('annual') || title.includes('fest')) {
    return '/img/annual-fest.jpg';
  }

  const category = String(event?.category || '').toLowerCase().trim();
  return CATEGORY_IMAGE_MAP[category] || '/img/other.jpg';
};

