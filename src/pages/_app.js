import { useEffect } from 'react';

export default function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('Loading Bootstrap JS');
            import('bootstrap/dist/js/bootstrap.bundle.min.js').then(() => {
                console.log('Bootstrap JS loaded');
            });
        }
    }, []);

    return (
        <>
            <Component {...pageProps} />
        </>
    );
}
