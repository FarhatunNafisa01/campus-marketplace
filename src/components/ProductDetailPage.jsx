import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, MapPin, Eye, Heart, Share2, MessageSquare, Phone,
    CheckCircle, Package, Tag, ShoppingBag, AlertCircle,
    Star, Calendar, TrendingUp, Shield
} from 'lucide-react';
import { getAuthUser, isAuthenticated, createConversation } from '../services/api';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        fetchProductDetail();
        checkUser();
    }, [id]);

    const checkUser = () => {
        if (isAuthenticated()) {
            setCurrentUser(getAuthUser());
        }
    };

    const fetchProductDetail = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/products/${id}`);
            const data = await response.json();

            // Transform data
            const transformedProduct = {
                id: data.id_produk,
                name: data.nama_barang,
                price: Number(data.harga),
                priceFormatted: `Rp ${Number(data.harga).toLocaleString('id-ID')}`,
                description: data.deskripsi,
                condition: data.kondisi === 'bekas' ? 'Bekas' : 'Baru',
                location: data.lokasi,
                image: data.url_foto?.startsWith('http')
                    ? data.url_foto
                    : `http://localhost:5000${data.url_foto}`,
                seller: {
                    id: data.id_pengguna,
                    name: data.nama_penjual,
                    phone: data.telp_penjual,
                    photo: data.foto_penjual?.startsWith('http')
                        ? data.foto_penjual
                        : `http://localhost:5000${data.foto_penjual}`,
                    rating: 5.0,
                    totalSales: 12
                },
                views: data.jumlah_dilihat,
                negotiable: data.bisa_nego,
                category: data.nama_kategori,
                stock: data.stok,
                createdAt: new Date(data.dibuat_pada).toLocaleDateString('id-ID'),
                status: data.status
            };

            setProduct(transformedProduct);
            setLoading(false);

            // Fetch related products
            fetchRelatedProducts(data.nama_kategori, data.id_produk);
        } catch (error) {
            console.error('Error fetching product:', error);
            setError('Gagal memuat detail produk');
            setLoading(false);
        }
    };

    const fetchRelatedProducts = async (category, excludeId) => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            const data = await response.json();

            const related = data
                .filter(p => p.nama_kategori === category && p.id_produk !== excludeId)
                .slice(0, 4)
                .map(p => ({
                    id: p.id_produk,
                    name: p.nama_barang,
                    price: `Rp ${Number(p.harga).toLocaleString('id-ID')}`,
                    image: p.url_foto?.startsWith('http')
                        ? p.url_foto
                        : `http://localhost:5000${p.url_foto}`,
                    condition: p.kondisi === 'bekas' ? 'Bekas' : 'Baru'
                }));

            setRelatedProducts(related);
        } catch (error) {
            console.error('Error fetching related products:', error);
        }
    };

    const handleChatSeller = async () => {
        if (!currentUser) {
            alert('Silakan login terlebih dahulu');
            navigate('/login');
            return;
        }

        if (product.seller.id === currentUser.id) {
            alert('Ini adalah produk Anda sendiri');
            return;
        }

        try {
            const conversationData = {
                id_pembeli: currentUser.id,
                id_penjual: product.seller.id,
                id_produk: product.id
            };

            await createConversation(conversationData);
            navigate('/chat');
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Gagal membuka chat: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.name,
                text: `${product.name} - ${product.priceFormatted}`,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link berhasil disalin!');
        }
    };

    const handleToggleFavorite = () => {
        if (!currentUser) {
            alert('Silakan login terlebih dahulu');
            navigate('/login');
            return;
        }
        setIsFavorite(!isFavorite);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: '#A4C3B2' }}></div>
                    <p className="text-gray-700 font-semibold">Memuat detail produk...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EEC6CA' }}>
                <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
                    <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h3>
                    <p className="text-gray-600 mb-4">{error || 'Produk tidak tersedia'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                        style={{ backgroundColor: '#A4C3B2' }}
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#EEC6CA' }}>
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition"
                        >
                            <ArrowLeft size={20} />
                            <span>Kembali</span>
                        </button>
                        <Link to="/" className="flex items-center space-x-2">
                            <ShoppingBag size={24} style={{ color: '#A4C3B2' }} />
                            <span className="font-bold text-gray-800">CampusMarket</span>
                        </Link>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleToggleFavorite}
                                className={`p-2 rounded-full transition ${isFavorite ? 'bg-red-50 text-red-500' : 'hover:bg-gray-100'}`}
                            >
                                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-full hover:bg-gray-100 transition"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Images */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Main Image */}
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.condition === 'Baru'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-yellow-500 text-white'
                                        }`}>
                                        {product.condition}
                                    </span>
                                    {product.negotiable && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#A4C3B2' }}>
                                            Bisa Nego
                                        </span>
                                    )}
                                </div>
                                <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                                    <Eye size={16} />
                                    <span>{product.views} views</span>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                                            <span className="flex items-center space-x-1">
                                                <MapPin size={16} />
                                                <span>{product.location}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <Calendar size={16} />
                                                <span>{product.createdAt}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <Tag size={16} />
                                                <span>{product.category}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-b py-6 my-6">
                                    <h2 className="text-3xl font-bold mb-2" style={{ color: '#A4C3B2' }}>
                                        {product.priceFormatted}
                                    </h2>
                                    {product.negotiable && (
                                        <p className="text-sm text-gray-600 flex items-center space-x-1">
                                            <CheckCircle size={14} style={{ color: '#A4C3B2' }} />
                                            <span>Harga bisa dinegosiasi</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3">Deskripsi</h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                        {product.description || 'Tidak ada deskripsi'}
                                    </p>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <Package size={20} style={{ color: '#A4C3B2' }} />
                                        <div>
                                            <p className="text-xs text-gray-500">Kondisi</p>
                                            <p className="font-semibold text-gray-800">{product.condition}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <TrendingUp size={20} style={{ color: '#A4C3B2' }} />
                                        <div>
                                            <p className="text-xs text-gray-500">Stok</p>
                                            <p className="font-semibold text-gray-800">{product.stock} unit</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Products */}
                        {relatedProducts.length > 0 && (
                            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Produk Terkait</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {relatedProducts.map((item) => (
                                        <Link
                                            key={item.id}
                                            to={`/product/${item.id}`}
                                            className="group"
                                        >
                                            <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-32 object-cover group-hover:scale-110 transition"
                                                />
                                                <div className="p-3">
                                                    <p className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm font-bold" style={{ color: '#A4C3B2' }}>
                                                        {item.price}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Seller Info & Actions */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Seller Card */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="font-bold text-gray-800 mb-4">Informasi Penjual</h3>
                                <div className="flex items-center space-x-4 mb-4">
                                    <img
                                        src={product.seller.photo}
                                        alt={product.seller.name}
                                        className="w-16 h-16 rounded-full object-cover border-2"
                                        style={{ borderColor: '#A4C3B2' }}
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{product.seller.name}</p>
                                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                                            <Star size={14} className="text-yellow-500" fill="currentColor" />
                                            <span>{product.seller.rating}</span>
                                            <span>• {product.seller.totalSales} terjual</span>
                                        </div>
                                    </div>
                                </div>

                                {currentUser?.id !== product.seller.id && (
                                    <>
                                        <button
                                            onClick={handleChatSeller}
                                            className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center space-x-2 mb-3"
                                            style={{ backgroundColor: '#A4C3B2' }}
                                        >
                                            <MessageSquare size={20} />
                                            <span>Chat Penjual</span>
                                        </button>
                                        <a
                                            href={`tel:${product.seller.phone}`}
                                            className="w-full bg-white border-2 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center space-x-2"
                                            style={{ borderColor: '#A4C3B2' }}
                                        >
                                            <Phone size={20} />
                                            <span>Hubungi</span>
                                        </a>
                                    </>
                                )}

                                {currentUser?.id === product.seller.id && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800 flex items-center space-x-2">
                                            <Shield size={16} />
                                            <span>Ini adalah produk Anda</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Safety Tips */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6">
                                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                                    <Shield size={20} style={{ color: '#A4C3B2' }} />
                                    <span>Tips Aman Bertransaksi</span>
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#A4C3B2' }} />
                                        <span>Bertemu di tempat umum & ramai</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#A4C3B2' }} />
                                        <span>Periksa kondisi barang sebelum bayar</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#A4C3B2' }} />
                                        <span>Jangan transfer sebelum lihat barang</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#A4C3B2' }} />
                                        <span>Gunakan metode pembayaran aman</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}