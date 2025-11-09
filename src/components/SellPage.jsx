import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, ArrowLeft, X, AlertCircle, CheckCircle, 
  Paperclip, Package, MapPin, Tag
} from 'lucide-react';

export default function SellPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    nama_barang: '',
    deskripsi: '',
    harga: '',
    kategori: '',
    kondisi: 'bekas',
    lokasi: '',
    stok: 1,
    bisa_nego: true
  });

  const categories = [
    { id: 1, name: 'Buku' },
    { id: 2, name: 'Elektronik' },
    { id: 3, name: 'Kost' },
    { id: 4, name: 'Alat Tulis' },
    { id: 5, name: 'Lainnya' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  const handleImageChange = (e) => {
    console.log('🖼️ Image change triggered');
    const file = e.target.files[0];
    
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Hanya file JPG, JPEG, dan PNG yang diperbolehkan!');
      console.log('❌ Invalid file type:', file.type);
      return;
    }

    // Validasi ukuran file
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB!');
      console.log('❌ File too large:', file.size);
      return;
    }

    // Baca file dan buat preview
    const reader = new FileReader();
    
    reader.onloadstart = () => {
      console.log('📖 Reading file...');
    };
    
    reader.onloadend = () => {
      console.log('✅ File read successfully');
      console.log('📸 Preview URL length:', reader.result?.length);
      
      setPreviewImage(reader.result);
      setImageFile(file);
      setError('');
      
      console.log('✅ State updated - preview and file set');
    };
    
    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error);
      setError('Gagal membaca file. Coba lagi.');
    };
    
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!formData.nama_barang.trim()) {
      setError('Nama barang wajib diisi');
      return false;
    }
    if (formData.nama_barang.length < 5) {
      setError('Nama barang minimal 5 karakter');
      return false;
    }
    if (!formData.kategori) {
      setError('Kategori wajib dipilih');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.deskripsi.trim()) {
      setError('Deskripsi wajib diisi');
      return false;
    }
    if (formData.deskripsi.length < 20) {
      setError('Deskripsi minimal 20 karakter');
      return false;
    }
    if (!previewImage) {
      setError('Foto produk wajib diunggah');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.harga || formData.harga === '0') {
      setError('Harga wajib diisi dan lebih dari 0');
      return false;
    }
    if (!formData.lokasi.trim()) {
      setError('Lokasi wajib diisi');
      return false;
    }
    if (formData.stok < 1) {
      setError('Stok minimal 1');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Anda belum login. Silakan login terlebih dahulu.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const formDataToSend = new FormData();
      
      formDataToSend.append('nama_barang', formData.nama_barang);
      formDataToSend.append('deskripsi', formData.deskripsi);
      formDataToSend.append('harga', formData.harga);
      formDataToSend.append('id_kategori', formData.kategori);
      formDataToSend.append('kondisi', formData.kondisi);
      formDataToSend.append('lokasi', formData.lokasi);
      formDataToSend.append('stok', formData.stok);
      formDataToSend.append('bisa_nego', formData.bisa_nego ? '1' : '0');

      if (imageFile) {
        formDataToSend.append('url_foto', imageFile);
      }

      console.log('=== SENDING DATA ===');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }
      
      const url = 'http://localhost:5000/api/products';
      console.log('POST to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Gagal posting produk');
      }

      setSuccess('Produk berhasil diposting!');
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message || 'Gagal posting produk');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / 3) * 100;

  // Debug info
  console.log('Current state:', {
    step,
    previewImage: previewImage ? 'SET' : 'NULL',
    imageFile: imageFile ? imageFile.name : 'NULL',
    formData: formData
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EEC6CA' }}>
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition">
              <div className="p-2 rounded-xl" style={{ backgroundColor: '#A4C3B2' }}>
                <ShoppingBag className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CampusMarket</h1>
                <p className="text-xs text-gray-500">Jual Barang Anda</p>
              </div>
            </Link>
            <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition">
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {step === 1 && 'Informasi Barang'}
                {step === 2 && 'Deskripsi & Foto'}
                {step === 3 && 'Harga & Lokasi'}
              </h2>
              <span className="text-sm font-semibold text-gray-600">Langkah {step} dari 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%`, backgroundColor: '#A4C3B2' }}
              />
            </div>
          </div>


          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start space-x-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start space-x-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Barang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="nama_barang"
                      value={formData.nama_barang}
                      onChange={handleChange}
                      placeholder="Contoh: Laptop ASUS ROG 2022"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formData.nama_barang.length}/100 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      name="kategori"
                      value={formData.kategori}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 appearance-none cursor-pointer"
                    >
                      <option value="">Pilih kategori...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kondisi <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="kondisi"
                        value="baru"
                        checked={formData.kondisi === 'baru'}
                        onChange={handleChange}
                        className="cursor-pointer"
                      />
                      <span className="ml-2 text-gray-700">Baru</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="kondisi"
                        value="bekas"
                        checked={formData.kondisi === 'bekas'}
                        onChange={handleChange}
                        className="cursor-pointer"
                      />
                      <span className="ml-2 text-gray-700">Bekas</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi Produk <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleChange}
                    placeholder="Jelaskan kondisi, spesifikasi, dan keunggulan produk Anda secara detail..."
                    rows="5"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.deskripsi.length}/1000 karakter</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Foto Produk <span className="text-red-500">*</span>
                  </label>
                  
                  {previewImage ? (
                    <div className="relative group">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                        onLoad={() => console.log('✅ Image rendered successfully')}
                        onError={() => console.log('❌ Image failed to render')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🗑️ Removing image');
                          setPreviewImage(null);
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={20} />
                      </button>
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-700">✓ Foto berhasil diunggah</p>
                        {imageFile && (
                          <p className="text-xs text-green-600 mt-1">
                            {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition">
                      <Paperclip size={48} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-700 font-medium mb-1">Klik untuk memilih foto</p>
                      <p className="text-sm text-gray-500">JPG, JPEG, PNG • Maksimal 5MB</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageChange}
                        className="hidden"
                        onClick={(e) => {
                          console.log('📁 File input clicked');
                          e.target.value = null; // Reset untuk bisa upload file yang sama
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Harga <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">Rp</span>
                    <input
                      type="number"
                      name="harga"
                      value={formData.harga}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                    />
                  </div>
                  {formData.harga && (
                    <p className="mt-2 text-lg font-bold text-gray-800">
                      Rp {parseInt(formData.harga).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lokasi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      name="lokasi"
                      value={formData.lokasi}
                      onChange={handleChange}
                      placeholder="Contoh: Medan, Jakarta, Surabaya"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stok</label>
                  <input
                    type="number"
                    name="stok"
                    value={formData.stok}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                  />
                </div>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="bisa_nego"
                    checked={formData.bisa_nego}
                    onChange={handleChange}
                    className="cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Harga bisa dinegosiasikan</span>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t">
              <button
                onClick={handlePrevStep}
                disabled={step === 1}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Kembali
              </button>
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  Lanjut →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  style={{ backgroundColor: '#A4C3B2' }}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Memposting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Posting Produk</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}