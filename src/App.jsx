import { useEffect, useRef, useState } from 'react'
import './App.css'

const STAGES = ['Menunggu Approval', 'Disetujui', 'Dokumen Digenerate', 'Sudah TTD', 'Dana Cair']

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

function SignaturePad({ id, canvasRef }) {
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
  }, [canvasRef, id])

  return <canvas id={`sig_${id}`} ref={canvasRef} width="360" height="130" />
}

function App() {
  const [activeTab, setActiveTab] = useState('form')
  const [formData, setFormData] = useState(initialFormState)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [pengajuanList, setPengajuanList] = useState([])
  const [idCounter, setIdCounter] = useState(1)
  const sigRefs = useRef({})

  const updateSelectedTab = (tab) => {
    setActiveTab(tab)
  }

  const handleInputChange = (event) => {
    const { id, value } = event.target

    setFormData((prev) => {
      const next = { ...prev, [id]: value }

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

  const handleSubmit = (event) => {
    event.preventDefault()

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
      files: uploadedFiles,
      status: 'Menunggu Approval',
      signature: null,
      catatan: '',
    }

    setPengajuanList((prev) => [...prev, data])
    setIdCounter((prev) => prev + 1)
    setFormData(initialFormState)
    setUploadedFiles([])
    event.target.reset()
    setActiveTab('tracking')
  }

  const setStatus = (id, status) => {
    setPengajuanList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item)),
    )
  }

  const generateDokumen = (id) => {
    setStatus(id, 'Dokumen Digenerate')
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
    if (!canvas) return

    const dataUrl = canvas.toDataURL()
    setPengajuanList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, signature: dataUrl, status: 'Sudah TTD' } : item,
      ),
    )
    alert('Tanda tangan tersimpan. Dokumen PO terkirim digital ke Dealer, tidak perlu serah terima fisik.')
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
                    <input
                      required
                      id="f_merk"
                      value={formData.f_merk}
                      onChange={handleInputChange}
                      placeholder="Contoh: Honda"
                    />
                  </div>
                  <div>
                    <label htmlFor="f_model">Model kendaraan</label>
                    <input
                      required
                      id="f_model"
                      value={formData.f_model}
                      onChange={handleInputChange}
                      placeholder="Contoh: Vario 160"
                    />
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
                    <input
                      id="f_warna"
                      value={formData.f_warna}
                      onChange={handleInputChange}
                      placeholder="Contoh: Hitam"
                    />
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
                <input type="file" id="f_files" multiple onChange={handleFileChange} />
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
                        onClick={() => setStatus(item.id, 'Disetujui')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="danger small secondary"
                        onClick={() => setStatus(item.id, 'Ditolak')}
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
                approved.map((item) => {
                  const canvasRef = (node) => {
                    if (node) {
                      sigRefs.current[item.id] = node
                    }
                  }

                  return (
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
                          <SignaturePad id={item.id} canvasRef={{ current: sigRefs.current[item.id] }} />
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
                  )
                })
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
                        onClick={() => setStatus(item.id, 'Dana Cair')}
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
