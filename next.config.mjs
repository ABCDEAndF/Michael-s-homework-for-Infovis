/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
      return [
          {
              source: '/api/csv',
              destination: 'https://gist.githubusercontent.com/hogwild/a716b6186d730c1d86962e9acaa1e59f/raw/aca017d18e2330668ef2765c5c049f89becda4ac/healthcare_stroke_data.csv',
          },
      ];
  },
};

export default nextConfig;
