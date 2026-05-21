"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Product = {
  id: string;
  name: string;
  description: string;
  size: string;
  material: string;
  mockup: string;
};

type UploadedItem = {
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "uploaded" | "error";
  fileUrl?: string;
  filePath?: string;
  error?: string;
};

function extractErrorMessage(value: unknown, fallback = "Generation failed") {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const maybe = value as { message?: unknown; error?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) return maybe.message;
    if (typeof maybe.error === "string" && maybe.error.trim()) return maybe.error;
    if (maybe.error && typeof maybe.error === "object") {
      const nested = maybe.error as { message?: unknown };
      if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    }
  }
  return fallback;
}

const products: Product[] = [
  {
    id: "wooden_plaque",
    name: "Wooden Plaque",
    description: "UV printed on wood with a warm handcrafted look.",
    size: "13 x 16.5 in",
    material: "wood",
    mockup: "/products/wooden.png"
  },
  {
    id: "glass_plaque",
    name: "Glass Plaque",
    description: "UV printed on glass/acrylic-style plaque with polished edges.",
    size: "13 x 16.5 in",
    material: "glass",
    mockup: "/products/glass.jpg"
  },
  {
    id: "glass_candle",
    name: "Glass Candle",
    description: "UV printed wrap for a calm memorial candle presentation.",
    size: "8 x 4 in wrap",
    material: "glass candle",
    mockup: "/products/candle.png"
  }
];

const steps = [
  { id: 1, title: "Product", subtitle: "Choose the piece" },
  { id: 2, title: "Person", subtitle: "Who it honors" },
  { id: 3, title: "Story", subtitle: "Style & memories" },
  { id: 4, title: "Review", subtitle: "Preview & submit" }
];

export default function StudioPage() {
  const [step, setStep] = useState(1);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [orientation, setOrientation] = useState("portrait");

  const [deceasedName, setDeceasedName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [passingDate, setPassingDate] = useState("");
  const [themeStyle, setThemeStyle] = useState("");
  const [colors, setColors] = useState("");
  const [spiritual, setSpiritual] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [quote, setQuote] = useState("");
  const [generalInstructions, setGeneralInstructions] = useState("");

  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [approvedPreviewId, setApprovedPreviewId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [zoomedImageUrl, setZoomedImageUrl] = useState("");
  const hasAutoStartedRef = useRef(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [selectedProductId]
  );
  const memorialDatesLabel = useMemo(() => [birthDate, passingDate].filter(Boolean).join(" — "), [birthDate, passingDate]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomedImageUrl("");
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    if (step !== 4) {
      hasAutoStartedRef.current = false;
      return;
    }

    if (hasAutoStartedRef.current) return;
    if (isGenerating || artworkUrl) return;
    if (!selectedProductId || !deceasedName.trim() || !hobbies.trim() || !generalInstructions.trim()) return;

    hasAutoStartedRef.current = true;
    void generatePreview();
  }, [step, isGenerating, artworkUrl, selectedProductId, deceasedName, hobbies, generalInstructions]);

  function nextStep() {
    setStep((current) => Math.min(4, current + 1));
  }

  function prevStep() {
    setStep((current) => Math.max(1, current - 1));
  }

  function onFilesPicked(fileList: FileList | null) {
    if (!fileList) return;
    if (uploads.length >= 8) return;

    const remainingSlots = Math.max(0, 8 - uploads.length);
    const next = Array.from(fileList).slice(0, remainingSlots).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      const allowed = ["image/jpeg", "image/png", "image/heic", "image/heif"];
      if (!allowed.includes(file.type)) {
        return { file, previewUrl, status: "error" as const, error: "Only JPG, PNG, or HEIC files are supported." };
      }
      if (file.size > 12 * 1024 * 1024) {
        return { file, previewUrl, status: "error" as const, error: "File is too large. Keep each photo under 12MB." };
      }
      return { file, previewUrl, status: "queued" as const };
    });

    setUploads((current) => [...current, ...next]);
  }

  async function removeUpload(index: number) {
    const target = uploads[index];
    setUploads((current) => current.filter((_, i) => i !== index));
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);

    if (target?.status === "uploaded") {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, filePath: target.filePath, fileUrl: target.fileUrl })
      });
    }
  }

  async function uploadAllPhotos() {
    const queuedIndexes = uploads
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === "queued");

    if (queuedIndexes.length === 0) return;

    setUploadMessage("Uploading photos...");

    for (const { index } of queuedIndexes) {
      const item = uploads[index];
      if (!item) continue;

      setUploads((current) => current.map((entry, i) => (i === index ? { ...entry, status: "uploading" } : entry)));

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("sessionId", sessionId);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");

        setUploads((current) =>
          current.map((entry, i) =>
            i === index ? { ...entry, status: "uploaded", fileUrl: json.fileUrl, filePath: json.path } : entry
          )
        );
      } catch (error) {
        setUploads((current) =>
          current.map((entry, i) =>
            i === index ? { ...entry, status: "error", error: error instanceof Error ? error.message : "Upload failed" } : entry
          )
        );
      }
    }

    setUploadMessage("Photos uploaded.");
  }

  async function generatePreview() {
    setPreviewError("");
    setSubmitError("");
    if (!selectedProduct) {
      setPreviewError("Please select a product first.");
      return;
    }
    if (!deceasedName.trim() || !hobbies.trim() || !generalInstructions.trim()) {
      setPreviewError("Please add honoring details and story notes before generating.");
      return;
    }

    await uploadAllPhotos();

    if (uploads.some((item) => item.status === "error")) {
      setPreviewError("Please fix or remove failed uploads before generating a preview.");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          material: selectedProduct.material,
          orientation,
          deceasedName,
          memorialDates: memorialDatesLabel,
          quoteOrMessage: quote,
          themeStyle,
          colors,
          religiousOrSpiritualElements: spiritual,
          hobbiesInterestsPlaces: hobbies,
          generalInstructions
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(extractErrorMessage(json?.error ?? json, "Generation failed"));

      setPreviewId(json.previewId);
      setArtworkUrl(json.artworkUrl);
      setApprovedPreviewId("");
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Preview generation failed. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function approvePreview() {
    if (!previewId) return;
    setSubmitError("");

    const res = await fetch("/api/previews/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, previewId })
    });
    const json = await res.json();

    if (!res.ok) {
      setPreviewError(json.error || "Could not approve preview");
      return null;
    }

    setApprovedPreviewId(json.previewId);
    return json.previewId as string;
  }

  async function submitOrder(approvedIdOverride?: string) {
    setSubmitError("");
    const finalApprovedId = approvedIdOverride || approvedPreviewId;

    if (!finalApprovedId) {
      setSubmitError("Please approve a preview before submitting your request.");
      return;
    }

    const required = [customerName, customerEmail, customerPhone, line1, city, region, postalCode, country];
    if (required.some((value) => !value.trim())) {
      setSubmitError("Please complete all required contact and shipping fields.");
      return;
    }

    if (!selectedProduct) {
      setSubmitError("Product selection is missing.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          approved_preview_id: finalApprovedId,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          orientation,
          deceased_name: deceasedName,
          memorial_dates: memorialDatesLabel,
          theme_style: themeStyle,
          colors,
          religious_or_spiritual_elements: spiritual,
          hobbies_interests_places: hobbies,
          quote_or_message: quote,
          general_instructions: generalInstructions,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          shipping_address_line_1: line1,
          shipping_address_line_2: line2,
          shipping_city: city,
          shipping_region: region,
          shipping_postal_code: postalCode,
          shipping_country: country,
          customer_notes: ""
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      setOrderId(json.orderId);
      setStep(5);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand">Eturnal Prints</div>
        <div className="subbrand">MEMORIAL DESIGN</div>
      </header>

      {step <= 4 ? (
        <section className="journey card">
          <div className="journey-head">
            <div>
              <h1>Create a memorial design with care</h1>
              <p>A few guided steps. We review every order with you before production.</p>
            </div>
            <p className="step-count">Step {step} of 4</p>
          </div>
          <div className="progress-track">
            <span style={{ width: `${((step - 1) / 3) * 100}%` }} />
          </div>
          <div className="step-pill-row">
            {steps.map((item) => (
              <button type="button" key={item.id} className={step >= item.id ? "step-pill active" : "step-pill"} onClick={() => setStep(item.id)}>
                <span className="dot">{step > item.id ? "✓" : item.id}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step <= 4 ? (
        <section className="studio-layout">
          <section className="main-panel card">
            {step === 1 ? (
              <>
                <p className="eyebrow">Step 1</p>
                <h2>Choose your product</h2>
                <p>Each piece is UV printed and finished by hand. You can change this any time.</p>
                <div className="grid products">
                  {products.map((product) => (
                    <article key={product.id} className={selectedProductId === product.id ? "product-card selected" : "product-card"}>
                      <img
                        src={product.mockup}
                        alt={product.name}
                        onClick={() => setZoomedImageUrl(product.mockup)}
                        className="clickable-image"
                      />
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <p className="meta">Printable area: {product.size}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductId(product.id);
                        }}
                      >
                        {selectedProductId === product.id ? "Selected" : "Select"}
                      </button>
                    </article>
                  ))}
                </div>
                <div className="panel-actions">
                  <span />
                  <button type="button" onClick={nextStep} disabled={!selectedProductId}>Next Step</button>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <p className="eyebrow">Step 2</p>
                <h2>Who are we honoring?</h2>
                <p>Just the basics. Only the name is required.</p>
                <div className="grid two">
                  <div>
                    <label>Full name *</label>
                    <input value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} placeholder="e.g. Mary Elizabeth Peterson" />
                  </div>
                  <div>
                    <label>Orientation</label>
                    <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label>Date of birth (optional)</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                  </div>
                  <div>
                    <label>Date of passing (optional)</label>
                    <input type="date" value={passingDate} onChange={(e) => setPassingDate(e.target.value)} />
                  </div>
                </div>
                <div className="panel-actions">
                  <button type="button" className="ghost" onClick={prevStep}>Back</button>
                  <button type="button" onClick={nextStep} disabled={!deceasedName.trim()}>Next Step</button>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <p className="eyebrow">Step 3</p>
                <h2>Tell us their story</h2>
                <p>The more we know, the more personal the design will feel.</p>
                <div className="grid two">
                  <div>
                    <label>Preferred theme or style</label>
                    <input value={themeStyle} onChange={(e) => setThemeStyle(e.target.value)} placeholder="e.g. rustic, classical, modern" />
                  </div>
                  <div>
                    <label>Colors</label>
                    <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="e.g. sage green, warm cream" />
                  </div>
                </div>
                <label>Religious or spiritual elements</label>
                <input value={spiritual} onChange={(e) => setSpiritual(e.target.value)} placeholder="e.g. cross, dove, scripture reference" />

                <label>Hobbies, interests, places, or objects *</label>
                <textarea rows={3} value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="e.g. fishing at sunset, pine trees, cardinals" />

                <label>Quote, poem, scripture, or short message</label>
                <textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="e.g. Forever in our hearts" />

                <label>General instructions *</label>
                <textarea rows={3} value={generalInstructions} onChange={(e) => setGeneralInstructions(e.target.value)} placeholder="Tell us how you want the design to feel." />
                <p className="helper">Tell us what you want the design to feel like.</p>

                <label>Photos (optional)</label>
                <input
                  id="photo-upload"
                  className="file-input-hidden"
                  type="file"
                  accept="image/png,image/jpeg,image/heic,image/heif"
                  multiple
                  onChange={(e) => onFilesPicked(e.target.files)}
                />
                <label htmlFor="photo-upload" className="upload-dropzone">
                  <span className="upload-icon">↥</span>
                  <span className="upload-title">Click to upload photos</span>
                  <span className="upload-subtitle">JPG or PNG, up to 8 images</span>
                </label>
                <div className="thumb-row">
                  {uploads.map((item, index) => (
                    <div className="thumb" key={`${item.file.name}-${index}`}>
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        onClick={() => setZoomedImageUrl(item.previewUrl)}
                        className="clickable-image"
                      />
                      <small>{item.file.name}</small>
                      <small>{item.status}</small>
                      {item.error ? <small className="error">{item.error}</small> : null}
                      <button type="button" className="ghost" onClick={() => removeUpload(index)}>Remove</button>
                    </div>
                  ))}
                </div>
                {uploadMessage ? <p>{uploadMessage}</p> : null}

                <div className="panel-actions">
                  <button type="button" className="ghost" onClick={prevStep}>Back</button>
                  <button type="button" onClick={nextStep} disabled={!hobbies.trim() || !generalInstructions.trim()}>Next Step</button>
                </div>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <p className="eyebrow">Step 4</p>
                <h2>Review and submit</h2>
                <p>Preview the design, then send it to our designers.</p>

                {artworkUrl ? (
                  <div className="preview-stage">
                    <img src={artworkUrl} alt="Memorial artwork preview" className="preview-main" />
                    <div className="text-overlay">
                      {quote.trim() ? <p className="overlay-quote">{quote}</p> : null}
                      <p className="overlay-name">{deceasedName}</p>
                      {memorialDatesLabel ? <p className="overlay-dates">{memorialDatesLabel}</p> : null}
                    </div>
                  </div>
                ) : (
                  <div className="empty-preview">
                    {isGenerating ? "Generating your preview. Please wait..." : "Generate a preview to continue."}
                  </div>
                )}

                <div className="review-card">
                  <div>
                    <h3>{selectedProduct?.name || "No product selected"}</h3>
                    <p className="meta">Printable area: {selectedProduct?.size || "-"}</p>
                  </div>
                  <button type="button" className="ghost" onClick={generatePreview} disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Regenerate Preview"}
                  </button>
                </div>

                <h3>Shipping details</h3>
                <div className="grid two">
                  <div>
                    <label>Full name *</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label>Email *</label>
                    <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                  </div>
                  <div>
                    <label>Phone *</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>
                  <div>
                    <label>Address line 1 *</label>
                    <input value={line1} onChange={(e) => setLine1(e.target.value)} />
                  </div>
                  <div>
                    <label>Address line 2</label>
                    <input value={line2} onChange={(e) => setLine2(e.target.value)} />
                  </div>
                  <div>
                    <label>City *</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <label>State / Region *</label>
                    <input value={region} onChange={(e) => setRegion(e.target.value)} />
                  </div>
                  <div>
                    <label>ZIP / Postal code *</label>
                    <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  </div>
                  <div>
                    <label>Country *</label>
                    <input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>

                {previewError ? <p className="error">{previewError}</p> : null}
                {submitError ? <p className="error">{submitError}</p> : null}

                <div className="panel-actions">
                  <button type="button" className="ghost" onClick={prevStep}>Back</button>
                  <div className="split-actions">
                    <button type="button" className="ghost" onClick={generatePreview} disabled={isGenerating}>
                      {isGenerating ? "Generating..." : "Generate Preview"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!artworkUrl) {
                          await generatePreview();
                          return;
                        }
                        const approvedId = await approvePreview();
                        if (!approvedId) return;
                        await submitOrder(approvedId);
                      }}
                      disabled={isSubmitting || !artworkUrl}
                    >
                      {isSubmitting ? "Submitting..." : "Approve and Submit"}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </section>

          <aside className="side-panel card">
            <p className="eyebrow">Your Design</p>
            {selectedProduct ? (
              <div className="chosen-product">
                <img src={selectedProduct.mockup} alt={selectedProduct.name} />
                <div>
                  <strong>{selectedProduct.name}</strong>
                  <p>{selectedProduct.size}</p>
                </div>
              </div>
            ) : (
              <div className="empty-choice">No product selected yet.</div>
            )}
            <div className="summary-grid">
              <p>Honoring</p><p>{deceasedName || "-"}</p>
              <p>Orientation</p><p>{orientation === "portrait" ? "Portrait" : "Landscape"}</p>
              <p>Theme</p><p>{themeStyle || "-"}</p>
              <p>Photos</p><p>{uploads.filter((file) => file.status !== "error").length || "-"}</p>
            </div>
            <p className="helper">Nothing is final yet. We&apos;ll review the full brief with you before production.</p>
            <button type="button" onClick={nextStep} disabled={step >= 4}>Next Step</button>
          </aside>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="card confirm">
          <h2>Thank you</h2>
          <p>Your memorial product request has been submitted. We will review the artwork and contact you before production.</p>
          <p><strong>Confirmation Number:</strong> {orderId}</p>
          <p><strong>Product:</strong> {selectedProduct?.name}</p>
          <p><strong>Email:</strong> {customerEmail}</p>
        </section>
      ) : null}

      {zoomedImageUrl ? (
        <div className="image-modal-backdrop" onClick={() => setZoomedImageUrl("")}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setZoomedImageUrl("")}>
              Close
            </button>
            <img src={zoomedImageUrl} alt="Full-size upload preview" className="image-modal-img" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
