import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STAGES = ['Menunggu Approval', 'Disetujui', 'Dokumen Digenerate', 'Sudah TTD', 'Dana Cair']

const VEHICLE_BRANDS = {
  Honda: ['Vario 160', 'Beat Street', 'PCX Hybrid', 'CBR 150R'],
  Yamaha: ['R25', 'NMax', 'Vixion', 'Aerox 155', 'YZF-R15'],
  Kawasaki: ['Ninja 250', 'KLX 150', 'W175', 'R15M'],
  Suzuki: ['GSX-R150', 'Satria F150', 'Address 125', 'Nex'],
  Vespa: ['Sprint', 'GTS', 'Primavera'],
  KTM: ['Duke 200', 'Duke 390', 'RC 200'],
}

const VEHICLE_COLORS = ['Hitam', 'Putih', 'Merah', 'Biru', 'Abu-abu', 'Silver', 'Hijau', 'Kuning']

const initialFormState = {
  f_nama: '',
  f_nik: '',
  f_tgl: '',
  f_status: 'Belum Menikah',
  f_pasangan: '',
  f_dealer: '',
  f_merk: '',
  f_model: '',
  f_tipe: '',
  f_warna: '',
  f_harga: '',
  f_asuransi: 'All Risk',
  f_dp: '',
  f_lama: '',
  f_angsuran: '',
}

function SignaturePad({ id, registerCanvas }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (canvasRef.current) {
      registerCanvas(id, canvasRef.current)
    }
  }, [id, registerCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.strokeStyle = '#232220'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    let drawing = false

    const getPosition = (event) => {
      const rect = canvas.getBoundingClientRect()
      const point = event.touches ? event.touches[0] : event
      return {
        x: point.clientX - rect.left,
        y: point.clientY - rect.top,
      }
    }

    const startDrawing = (event) => {
      drawing = true
      const point = getPosition(event)
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
    }

    const draw = (event) => {
      if (!drawing) return
      const point = getPosition(event)
      ctx.lineTo(point.x, point.y)
      ctx.stroke()
      event.preventDefault()
    }

    const stopDrawing = () => {
      drawing = false
    }

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    window.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('touchstart', startDrawing)
    canvas.addEventListener('touchmove', draw)
    canvas.addEventListener('touchend', stopDrawing)

    return () => {
      canvas.removeEventListener('mousedown', startDrawing)
      canvas.removeEventListener('mousemove', draw)
      window.removeEventListener('mouseup', stopDrawing)
      canvas.removeEventListener('touchstart', startDrawing)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', stopDrawing)
    }
  }, [id])

  return <canvas id={`sig_${id}`} ref={canvasRef} width="360" height="130" />
}

function App() {
  const [activeTab, setActiveTab] = useState('form')
  const [formData, setFormData] = useState(initialFormState)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [pengajuanList, setPengajuanList] = useState([])
  const [idCounter, setIdCounter] = useState(1)
  const [toast, setToast] = useState(null)
  const sigRefs = useRef({})

  const selectedBrandModels = useMemo(
    () => VEHICLE_BRANDS[formData.f_merk] || [],
    [formData.f_merk],
  )

  useEffect(() => {
    if (!toast) return

    const timer = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(timer)
  }, [toast])

  const showToast = (type, message) => {
    setToast({ type, message })
  }

  const updateSelectedTab = (tab) => {
    setActiveTab(tab)
  }

  const handleInputChange = (event) => {
    const { id, value } = event.target

    setFormData((prev) => {
      const next = { ...prev, [id]: value }

      if (id === 'f_merk') {
        next.f_model = ''
      }

      if (['f_harga', 'f_dp', 'f_lama'].includes(id)) {
        const harga = Number(next.f_harga) || 0
        const dp = Number(next.f_dp) || 0
        const lama = Number(next.f_lama) || 0

        if (harga > 0 && lama > 0) {
          next.f_angsuran = String(Math.round(Math.max(harga - dp, 0) / lama))
        }
      }

      return next
    })
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(files.map((file) => file.name))
  }

  const validateForm = (data, files) => {
    if (!data.f_nama.trim()) return { valid: false, message: 'Nama lengkap wajib diisi.' }
    if (!/^\d{16}$/.test(data.f_nik.trim())) {
      return { valid: false, message: 'NIK harus berisi 16 digit angka.' }
    }
    if (!data.f_tgl) return { valid: false, message: 'Tanggal lahir wajib diisi.' }
    if (!data.f_dealer.trim()) return { valid: false, message: 'Dealer wajib diisi.' }
    if (!data.f_merk) return { valid: false, message: 'Merk kendaraan wajib dipilih.' }
    if (!data.f_model) return { valid: false, message: 'Model kendaraan wajib dipilih.' }
    if (!data.f_warna) return { valid: false, message: 'Warna kendaraan wajib dipilih.' }
    if (!data.f_harga || Number(data.f_harga) <= 0) {
      return { valid: false, message: 'Harga kendaraan harus lebih dari 0.' }
    }
    if (!data.f_dp || Number(data.f_dp) < 0) {
      return { valid: false, message: 'Down payment wajib diisi dengan angka valid.' }
    }
    if (!data.f_lama || Number(data.f_lama) <= 0) {
      return { valid: false, message: 'Lama kredit harus lebih dari 0.' }
    }
    if (!files.length) {
      return { valid: false, message: 'Dokumen digital wajib diupload berupa gambar.' }
    }
    const invalidImage = files.some((file) => !file.type.startsWith('image/'))
    if (invalidImage) {
      return { valid: false, message: 'Dokumen digital harus berupa file gambar.' }
    }

    return { valid: true, message: 'Berhasil' }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const files = Array.from(event.target.querySelector('input[type="file"]').files || [])
    const validation = validateForm(formData, files)

    if (!validation.valid) {
      showToast('error', validation.message)
      return
    }

    const data = {
      id: `PJ-${String(idCounter).padStart(4, '0')}`,
      nama: formData.f_nama,
      nik: formData.f_nik,
      tglLahir: formData.f_tgl,
      statusKawin: formData.f_status,
      pasangan: formData.f_pasangan,
      dealer: formData.f_dealer,
      merk: formData.f_merk,
      model: formData.f_model,
      tipe: formData.f_tipe,
      warna: formData.f_warna,
      harga: formData.f_harga,
      asuransi: formData.f_asuransi,
      dp: formData.f_dp,
      lama: formData.f_lama,
      angsuran: formData.f_angsuran,
      files: files.map((file) => file.name),
      status: 'Menunggu Approval',
      signature: null,
      catatan: '',
    }

    setPengajuanList((prev) => [...prev, data])
    setIdCounter((prev) => prev + 1)
    setFormData(initialFormState)
    setUploadedFiles([])
    event.target.reset()
    showToast('success', `Pengajuan ${data.id} berhasil dikirim.`)
    setActiveTab('tracking')
  }

  const setStatus = (id, status) => {
    setPengajuanList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  const handleApprove = (id) => {
    const item = pengajuanList.find((entry) => entry.id === id)
    if (!item) {
      showToast('error', 'Data pengajuan tidak ditemukan.')
      return
    }

    setStatus(id, 'Disetujui')
    showToast('success', `Pengajuan ${id} berhasil disetujui.`)
  }

  const handleReject = (id) => {
    const item = pengajuanList.find((entry) => entry.id === id)
    if (!item) {
      showToast('error', 'Data pengajuan tidak ditemukan.')
      return
    }

    setStatus(id, 'Ditolak')
    showToast('success', `Pengajuan ${id} berhasil ditolak.`)
  }

  const generateDokumen = (id) => {
    setStatus(id, 'Dokumen Digenerate')
    showToast('success', `Dokumen ${id} berhasil digenerate.`)
  }

  const registerCanvas = (id, canvas) => {
    sigRefs.current[id] = canvas
  }

  const clearSignature = (id) => {
    const canvas = sigRefs.current[id]
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const simpanTTD = (id) => {
    const canvas = sigRefs.current[id]
    if (!canvas) {
      showToast('error', 'Canvas tanda tangan belum siap, silakan coba lagi.')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      showToast('error', 'Tanda tangan gagal diproses.')
      return
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    const isEmpty = !Array.from(imageData).some((value) => value !== 0)

    if (isEmpty) {
      showToast('error', 'Silakan tanda tangan terlebih dahulu sebelum submit.')
      return
    }

    const dataUrl = canvas.toDataURL()
    setPengajuanList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, signature: dataUrl, status: 'Sudah TTD' } : item,
      ),
    )
    showToast('success', `Tanda tangan ${id} berhasil disimpan.`)
  }

  const handlePencairan = (id) => {
    const item = pengajuanList.find((entry) => entry.id === id)
    if (!item) {
      showToast('error', 'Data pencairan tidak ditemukan.')
      return
    }

    setStatus(id, 'Dana Cair')
    showToast('success', `Dana untuk ${id} berhasil dicairkan.`)
  }

  const pending = pengajuanList.filter((item) => item.status === 'Menunggu Approval')
  const approved = pengajuanList.filter((item) =>
    ['Disetujui', 'Dokumen Digenerate'].includes(item.status),
  )
  const readyForPencairan = pengajuanList.filter((item) =>
    ['Sudah TTD', 'Dana Cair'].includes(item.status),
  )

  return (
    <>
      {toast && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}

      <header>
        <h1>Sistem Pengajuan Kredit Digital &mdash; PT. JKL</h1>
        <p>
          Menggantikan pertukaran dokumen fisik dengan alur digital: form online, approval
          sistem, dokumen otomatis, dan tanda tangan digital.
        </p>
      </header>

      <nav>
        {[
          { key: 'form', label: '1. Form Pengajuan' },
          { key: 'approval', label: '2. Approval' },
          { key: 'dokumen', label: '3. Dokumen &amp; TTD' },
          { key: 'pencairan', label: '4. Pencairan Dana' },
          { key: 'tracking', label: 'Tracking Semua Pengajuan' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeTab === item.key ? 'active' : ''}
            onClick={() => updateSelectedTab(item.key)}
          >
            <span dangerouslySetInnerHTML={{ __html: item.label }} />
          </button>
        ))}
      </nav>

      <main>
        <section id="form" className={activeTab === 'form' ? 'active' : ''}>
          <div className="card">
            <h2>Form pengajuan kredit</h2>
            <p className="desc">
              Diisi langsung oleh konsumen. Menggantikan proses "hubungi konsumen, collect
              data" dan fotokopi dokumen manual.
            </p>

            <form id="pengajuanForm" onSubmit={handleSubmit}>
              <fieldset>
                <legend>Data konsumen</legend>
                <div className="grid">
                  <div>
                    <label htmlFor="f_nama">Nama lengkap</label>
                    <input
                      required
                      id="f_nama"
                      value={formData.f_nama}
                      onChange={handleInputChange}
                      placeholder="Nama sesuai KTP"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_nik">NIK</label>
                    <input
                      required
                      id="f_nik"
                      value={formData.f_nik}
                      onChange={handleInputChange}
                      maxLength={16}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="16 digit NIK"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_tgl">Tanggal lahir</label>
                    <input
                      required
                      id="f_tgl"
                      type="date"
                      value={formData.f_tgl}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="f_status">Status perkawinan</label>
                    <select id="f_status" value={formData.f_status} onChange={handleInputChange}>
                      <option>Belum Menikah</option>
                      <option>Menikah</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f_pasangan">Data pasangan (jika menikah)</label>
                    <input
                      id="f_pasangan"
                      value={formData.f_pasangan}
                      onChange={handleInputChange}
                      placeholder="Nama pasangan, opsional"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Data kendaraan</legend>
                <div className="grid">
                  <div>
                    <label htmlFor="f_dealer">Dealer</label>
                    <input
                      required
                      id="f_dealer"
                      value={formData.f_dealer}
                      onChange={handleInputChange}
                      placeholder="Nama dealer"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_merk">Merk kendaraan</label>
                    <select id="f_merk" value={formData.f_merk} onChange={handleInputChange}>
                      <option value="">Pilih merk kendaraan</option>
                      {Object.keys(VEHICLE_BRANDS).map((merk) => (
                        <option key={merk} value={merk}>
                          {merk}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f_model">Model kendaraan</label>
                    <select
                      id="f_model"
                      value={formData.f_model}
                      onChange={handleInputChange}
                      disabled={!selectedBrandModels.length}
                    >
                      <option value="">{selectedBrandModels.length ? 'Pilih model kendaraan' : 'Pilih merk terlebih dahulu'}</option>
                      {selectedBrandModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f_tipe">Tipe kendaraan</label>
                    <input
                      id="f_tipe"
                      value={formData.f_tipe}
                      onChange={handleInputChange}
                      placeholder="Contoh: CBS ISS"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_warna">Warna kendaraan</label>
                    <select id="f_warna" value={formData.f_warna} onChange={handleInputChange}>
                      <option value="">Pilih warna kendaraan</option>
                      {VEHICLE_COLORS.map((warna) => (
                        <option key={warna} value={warna}>
                          {warna}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f_harga">Harga kendaraan (Rp)</label>
                    <input
                      required
                      id="f_harga"
                      type="number"
                      value={formData.f_harga}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Data pinjaman</legend>
                <div className="grid">
                  <div>
                    <label htmlFor="f_asuransi">Asuransi</label>
                    <select
                      id="f_asuransi"
                      value={formData.f_asuransi}
                      onChange={handleInputChange}
                    >
                      <option>All Risk</option>
                      <option>TLO</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="f_dp">Down payment (Rp)</label>
                    <input
                      required
                      id="f_dp"
                      type="number"
                      value={formData.f_dp}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_lama">Lama kredit (bulan)</label>
                    <input
                      required
                      id="f_lama"
                      type="number"
                      value={formData.f_lama}
                      onChange={handleInputChange}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_angsuran">Angsuran per bulan (Rp)</label>
                    <input
                      id="f_angsuran"
                      type="number"
                      value={formData.f_angsuran}
                      onChange={handleInputChange}
                      placeholder="Otomatis dihitung"
                      readOnly
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend>Upload dokumen digital</legend>
                <p className="desc" style={{ marginBottom: '8px' }}>
                  Menggantikan fotokopi KTP, Bukti Bayar Tanda Jadi, Form Aplikasi, dan Kartu
                  Keluarga.
                </p>
                <label htmlFor="f_files">Pilih file (KTP, Bukti Bayar, Kartu Keluarga, dll)</label>
                <input type="file" id="f_files" accept="image/*" multiple required onChange={handleFileChange} />
                <div id="fileList" style={{ marginTop: '8px' }}>
                  {uploadedFiles.map((fileName) => (
                    <div key={fileName} className="file-row">
                      File terlampir: {fileName}
                    </div>
                  ))}
                </div>
              </fieldset>

              <button type="submit" className="primary">
                Submit pengajuan
              </button>
            </form>
          </div>
        </section>

        <section id="approval" className={activeTab === 'approval' ? 'active' : ''}>
          <div className="card">
            <h2>Dashboard approval &mdash; Atasan Marketing</h2>
            <p className="desc">
              Menggantikan approval manual yang menunggu dokumen fisik. Atasan Marketing approve
              atau reject langsung dari sistem.
            </p>
            <div id="approvalList">
              {pending.length === 0 ? (
                <div className="empty">Tidak ada pengajuan yang menunggu approval.</div>
              ) : (
                pending.map((item) => (
                  <div key={item.id} className="card inner-card">
                    <strong>
                      {item.id} &mdash; {item.nama}
                    </strong>
                    <p className="desc">
                      {item.merk} {item.model} ({item.tipe || '-'}) &middot; Harga Rp
                      {Number(item.harga).toLocaleString('id-ID')} &middot; Dealer: {item.dealer}
                    </p>
                    <p className="desc">
                      Angsuran: Rp{Number(item.angsuran || 0).toLocaleString('id-ID')}/bulan selama{' '}
                      {item.lama} bulan &middot; Dokumen terlampir: {item.files.length} file
                    </p>
                    <div className="actions">
                      <button
                        type="button"
                        className="primary small"
                        onClick={() => handleApprove(item.id)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="danger small secondary"
                        onClick={() => handleReject(item.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="dokumen" className={activeTab === 'dokumen' ? 'active' : ''}>
          <div className="card">
            <h2>Generate dokumen &amp; tanda tangan digital</h2>
            <p className="desc">
              Admin Backoffice generate Dokumen Kontrak &amp; PO otomatis. Konsumen tanda tangan
              langsung di sistem (e-signature), menggantikan cetak &ndash; TTD basah &ndash;
              scan ulang.
            </p>
            <div id="dokumenList">
              {approved.length === 0 ? (
                <div className="empty">Belum ada pengajuan yang disetujui.</div>
              ) : (
                approved.map((item) => (
                  <div key={item.id} className="card inner-card">
                    <strong>
                      {item.id} &mdash; {item.nama}
                    </strong>

                    {item.status === 'Disetujui' ? (
                      <>
                        <p className="desc">
                          Pengajuan sudah disetujui. Generate Dokumen Kontrak &amp; PO secara
                          otomatis dari data sistem.
                        </p>
                        <button
                          type="button"
                          className="primary small"
                          onClick={() => generateDokumen(item.id)}
                        >
                          Generate dokumen
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="desc">
                          Dokumen Kontrak &amp; PO sudah digenerate. Konsumen tanda tangan digital
                          di bawah ini.
                        </p>
                        <SignaturePad id={item.id} registerCanvas={registerCanvas} />
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary small"
                            onClick={() => clearSignature(item.id)}
                          >
                            Bersihkan
                          </button>
                          <button
                            type="button"
                            className="primary small"
                            onClick={() => simpanTTD(item.id)}
                          >
                            Simpan tanda tangan &amp; kirim PO ke Dealer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="pencairan" className={activeTab === 'pencairan' ? 'active' : ''}>
          <div className="card">
            <h2>Pencairan dana &mdash; Admin Backoffice</h2>
            <p className="desc">
              Diproses setelah dokumen ditandatangani dan PO terkirim ke Dealer secara digital.
            </p>
            <div id="pencairanList">
              {readyForPencairan.length === 0 ? (
                <div className="empty">Belum ada dokumen yang siap dicairkan.</div>
              ) : (
                readyForPencairan.map((item) => (
                  <div key={item.id} className="card inner-card">
                    <strong>
                      {item.id} &mdash; {item.nama}
                    </strong>
                    <p className="desc">
                      Dokumen sudah ditandatangani.{' '}
                      {item.status === 'Dana Cair'
                        ? 'Dana sudah dicairkan.'
                        : 'Siap diproses pencairan dana.'}
                    </p>
                    {item.status === 'Sudah TTD' ? (
                      <button
                        type="button"
                        className="primary small"
                        onClick={() => handlePencairan(item.id)}
                      >
                        Cairkan dana
                      </button>
                    ) : (
                      <span className="badge approved">Selesai</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section id="tracking" className={activeTab === 'tracking' ? 'active' : ''}>
          <div className="card">
            <h2>Tracking semua pengajuan</h2>
            <p className="desc">
              Satu sumber status untuk semua pihak &mdash; konsumen, marketing, atasan, dan admin
              backoffice melihat data yang sama.
            </p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Konsumen</th>
                  <th>Kendaraan</th>
                  <th>Status</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {pengajuanList.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="empty">Belum ada pengajuan.</div>
                    </td>
                  </tr>
                ) : (
                  pengajuanList.map((item) => {
                    const badgeClass =
                      item.status === 'Ditolak'
                        ? 'rejected'
                        : item.status === 'Dana Cair'
                          ? 'approved'
                          : 'progress'

                    const stepsHtml = STAGES.map((stage) => {
                      const idx = STAGES.indexOf(stage)
                      const curIdx = STAGES.indexOf(item.status)
                      let classes = 'step'

                      if (item.status !== 'Ditolak' && idx < curIdx) {
                        classes += ' done'
                      } else if (item.status !== 'Ditolak' && idx === curIdx) {
                        classes += ' current'
                      }

                      return (
                        <span key={`${item.id}-${stage}`} className={classes}>
                          {stage}
                        </span>
                      )
                    })

                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.nama}</td>
                        <td>
                          {item.merk} {item.model}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{item.status}</span>
                        </td>
                        <td>
                          <div className="track">
                            {item.status === 'Ditolak' ? (
                              <span className="step rejected-tag">Ditolak</span>
                            ) : (
                              stepsHtml
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}

export default App
