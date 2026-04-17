-- Optional sample data

INSERT INTO nakamals (
  name,
  google_maps_link,
  opening_time,
  closing_time,
  alcohol_available,
  kakai_available,
  kava_windows_count,
  rate
)
VALUES
(
  'Blue Lagoon Nakamal',
  'https://maps.google.com',
  '16:00',
  '23:30',
  false,
  true,
  4,
  4.5
);

INSERT INTO nakamal_photos (nakamal_id, photo_url, caption)
VALUES
(1, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4', 'Front area'),
(1, 'https://images.unsplash.com/photo-1552566626-52f8b828add9', 'Inside seating');

INSERT INTO nakamal_comments (nakamal_id, nickname, comment_text)
VALUES
(1, 'Bri', 'Nice atmosphere and easy to find.'),
(1, 'Sam', 'Good kakai and quick service.');
