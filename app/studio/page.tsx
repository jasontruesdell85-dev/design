"use client";

import { useEffect, useMemo, useState } from "react";

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

const products: Product[] = [
  {
    id: "wooden_plaque",
    name: "Wooden Plaque",
    description: "UV printed on wood with a warm handcrafted look.",
    size: "13 in x 16.5 in",
    material: "wood",
    mockup: "/products/wooden.png"
  },
  {
    id: "glass_plaque",
    name: "Glass Plaque",
    description: "UV printed on glass/acrylic-style plaque with polished edges.",
    size: "13 in x 16.5 in",
    material: "glass",
    mockup: "/products/glass.jpg"
  },
  {
    id: "glass_candle",
    name: "Glass Candle",
    description: "UV printed wrap for a calm memorial candle presentation.",
    size: "8 in x 4 in wrap",
    material: "glass candle",
    mockup: "/products/candle.png"
  }
];

export default function StudioPage() {
  const [step, setStep] = useState(1);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [orientation, setOrientation] = useState("portrait");

  const [deceasedName, setDeceasedName] = useState("");
  const [memorialDates, setMemorialDates] = useState("");
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
  const [mockupUrl, setMockupUrl] = useState("");
  const [approvedPreviewId, setApprovedPreviewId] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [zoomedImageUrl, setZoomedImageUrl] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [selectedProductId]
  );

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomedImageUrl("");
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  function onFilesPicked(fileList: FileList | null) {
    if (!fileList) return;

    const next = Array.from(fileList).map((file) => {
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
    if (!selectedProduct) {
      setPreviewError("Please select a product first.");
      return;
    }
    if (!deceasedName.trim() || !hobbies.trim() || !generalInstructions.trim()) {
      setPreviewError("Please add name, theme details, and general instructions before generating.");
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
          memorialDates,
          quoteOrMessage: quote,
          themeStyle,
          colors,
          religiousOrSpiritualElements: spiritual,
          hobbiesInterestsPlaces: hobbies,
          generalInstructions
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");

      setPreviewId(json.previewId);
      setArtworkUrl(json.artworkUrl);
      setMockupUrl(json.mockupUrl);
      setApprovedPreviewId("");
      setStep(3);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Preview generation failed. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function approvePreview() {
    if (!previewId) return;

    const res = await fetch("/api/previews/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, previewId })
    });
    const json = await res.json();

    if (!res.ok) {
      setPreviewError(json.error || "Could not approve preview");
      return;
    }

    setApprovedPreviewId(json.previewId);
    setStep(4);
  }

  async function submitOrder() {
    setSubmitError("");

    if (!approvedPreviewId) {
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
          approved_preview_id: approvedPreviewId,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          orientation,
          deceased_name: deceasedName,
          memorial_dates: memorialDates,
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
          customer_notes: customerNotes
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
      <section className="hero card">
        <p className="eyebrow">AI Memorial Product Studio</p>
        <h1>Create a Memorial Design with Care</h1>
        <p>
          Build a respectful custom preview in a few guided steps. We will review everything with you before production.
        </p>
      </section>

      <section className="step-rail card">
        <div className={step >= 1 ? "active" : ""}>1. Choose Product</div>
        <div className={step >= 2 ? "active" : ""}>2. Share Details</div>
        <div className={step >= 3 ? "active" : ""}>3. Preview Design</div>
        <div className={step >= 4 ? "active" : ""}>4. Submit Request</div>
      </section>

      {step >= 1 ? (
        <section className="card">
          <h2>Choose Product</h2>
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
                <button type="button" onClick={() => { setSelectedProductId(product.id); if (step < 2) setStep(2); }}>
                  {selectedProductId === product.id ? "Selected" : "Select"}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {step >= 2 ? (
        <section className="card">
          <h2>Share Memorial Details</h2>
          <div className="grid">
            <div>
              <label>Name of Person Remembered *</label>
              <input value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} />
            </div>
            <div>
              <label>Dates (Optional)</label>
              <input value={memorialDates} onChange={(e) => setMemorialDates(e.target.value)} />
            </div>
            <div>
              <label>Orientation</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            <div>
              <label>Preferred Theme or Style</label>
              <input value={themeStyle} onChange={(e) => setThemeStyle(e.target.value)} />
            </div>
            <div>
              <label>Colors (Optional)</label>
              <input value={colors} onChange={(e) => setColors(e.target.value)} />
            </div>
            <div>
              <label>Religious or Spiritual Elements (Optional)</label>
              <input value={spiritual} onChange={(e) => setSpiritual(e.target.value)} />
            </div>
          </div>

          <label>Hobbies, Interests, Places, or Objects *</label>
          <textarea rows={3} value={hobbies} onChange={(e) => setHobbies(e.target.value)} />

          <label>Quote, Poem, Scripture, or Short Message (Optional)</label>
          <textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} />

          <label>General Instructions *</label>
          <p className="helper">Tell us what you would like the design to feel like. For example: Dad loved fishing at sunset, pine trees, cardinals, and quiet mornings at the lake. We want something warm, peaceful, and rustic.</p>
          <textarea rows={5} value={generalInstructions} onChange={(e) => setGeneralInstructions(e.target.value)} />

          <label>Photo Uploads</label>
          <input type="file" accept="image/png,image/jpeg,image/heic,image/heif" multiple onChange={(e) => onFilesPicked(e.target.files)} />
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
                <button type="button" className="secondary" onClick={() => removeUpload(index)}>Remove</button>
              </div>
            ))}
          </div>
          {uploadMessage ? <p>{uploadMessage}</p> : null}

          {previewError ? <p className="error">{previewError}</p> : null}

          <button type="button" onClick={generatePreview} disabled={isGenerating}>
            {isGenerating ? "Generating Preview..." : "Generate Preview"}
          </button>
        </section>
      ) : null}

      {step >= 3 && mockupUrl && artworkUrl ? (
        <section className="card">
          <h2>Preview Design</h2>
          <div className="preview-grid">
            <div>
              <h3>Product Mockup</h3>
              <img src={mockupUrl} alt="Product mockup preview" className="preview-main" />
            </div>
            <div>
              <h3>Flat Artwork</h3>
              <img src={artworkUrl} alt="Flat memorial artwork" className="preview-main" />
            </div>
          </div>

          <div className="grid">
            <p><strong>Product:</strong> {selectedProduct?.name}</p>
            <p><strong>Name:</strong> {deceasedName}</p>
            <p><strong>Dates:</strong> {memorialDates || "-"}</p>
            <p><strong>Style:</strong> {themeStyle || "-"}</p>
          </div>

          <div className="actions-row">
            <button type="button" onClick={approvePreview}>Approve and Continue</button>
            <button type="button" className="secondary" onClick={generatePreview}>Regenerate Preview</button>
            <button type="button" className="secondary" onClick={() => setStep(2)}>Edit Details</button>
          </div>
          {approvedPreviewId ? <p className="ok">Preview approved.</p> : null}
        </section>
      ) : null}

      {step >= 4 ? (
        <section className="card">
          <h2>Contact and Shipping Details</h2>
          <div className="grid">
            <div>
              <label>Full Name *</label>
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
              <label>Address Line 1 *</label>
              <input value={line1} onChange={(e) => setLine1(e.target.value)} />
            </div>
            <div>
              <label>Address Line 2</label>
              <input value={line2} onChange={(e) => setLine2(e.target.value)} />
            </div>
            <div>
              <label>City *</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label>Province/State *</label>
              <input value={region} onChange={(e) => setRegion(e.target.value)} />
            </div>
            <div>
              <label>Postal/ZIP Code *</label>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
            <div>
              <label>Country *</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <label>Notes for Seller (Optional)</label>
          <textarea rows={3} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />

          {submitError ? <p className="error">{submitError}</p> : null}

          <button type="button" onClick={submitOrder} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Order Request"}
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="card confirm">
          <h2>Thank You</h2>
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
