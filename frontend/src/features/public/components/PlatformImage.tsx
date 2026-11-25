import { Box, Typography } from '@mui/material';
const artwork = {
  operations: { width: 2664, height: 1504, alt: 'Bakaroo operations illustration showing a dispatcher, driver, fleet, and connected trip dashboard.' },
  platform: { width: 2048, height: 1152, alt: 'Bakaroo platform illustration connecting route planning, vehicle assignments, drivers, riders, and guardians.' },
  mobile: { width: 2664, height: 1504, alt: 'Bakaroo mobile and desktop illustration with a sign-in screen, route map, and passenger vehicles.' },
  transformation: { width: 2000, height: 2000, alt: 'Illustrated comparison of paper schedules and phone coordination with connected transportation software.' },
};
export function PlatformImage({ name, priority = false, caption }: {
  name: keyof typeof artwork; priority?: boolean; caption?: string;
}) {
  const image = artwork[name];
  return <Box component="figure" sx={{ m: 0, minWidth: 0 }}>
    <Box component="img" src={`/images/platform/${name}-960.webp`}
      srcSet={[640, 960, 1600].map(width => `/images/platform/${name}-${width}.webp ${width}w`).join(', ')}
      sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 92vw, 1200px"
      width={image.width} height={image.height} alt={image.alt}
      loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
      sx={{ display: 'block', width: '100%', height: 'auto', borderRadius: { xs: 1.5, md: 3 }, border: '1px solid #dde3e9' }} />
    <Typography component="figcaption" sx={{ mt: 1.5, color: 'inherit', opacity: .72, fontSize: '.75rem', lineHeight: 1.6 }}>
      {caption ?? 'Product illustration with sample data.'}
    </Typography>
  </Box>;
}
