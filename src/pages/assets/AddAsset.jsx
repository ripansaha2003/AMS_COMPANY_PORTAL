import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Upload, Calendar, X, Loader2 } from "lucide-react";
import Layout from "@/components/common/Layout";
import { useSetLocationArray } from "@/utils/locationSetter";
import AddCustomStatusModal from "@/components/assets/AddCustomStatusModal";
import CustomDatatable from "@/components/common/CustomDatatable";
import Menu from "@/components/common/Menu";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { axiosPrivate } from "@/axios/axiosInstance";
import axios from "axios";
import { useSubscription } from "@/context/SubscriptionContext";
import { useLimitCheck } from "@/hooks/useLimitCheck";

export default function AddAsset() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { refreshAfterAction } = useSubscription();
  const { checkLimit } = useLimitCheck("assets");

  // Check limit on component mount for direct URL access
  useEffect(() => {
    if (!isEditMode && !checkLimit()) {
      navigate("/asset");
    }
  }, []);

  const defaultFormData = {
    assetName: "",
    assetNumber: "",
    category: "",
    brandSelection: "",
    subCategory: "",
    description: "",
    location: "Static",
    selectVendor: "",
    selectDate: "",
    value: "",
    type: "declining-balance",
    depreciationValue: "",
    durationYears: "",
    date: "",
    primaryImage: null,
    galleryImages: [],
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [customStatuses, setCustomStatuses] = useState([]);
  const selectDateRef = useRef(null);

  const toInputDateValue = (ddmmyyyy) => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return "";
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  const handleSelectDateFromPicker = (e) => {
    const v = e.target.value; // yyyy-mm-dd
    if (!v) {
      setFormData((prev) => ({ ...prev, selectDate: "" }));
      return;
    }
    const d = new Date(v);
    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
    setFormData((prev) => ({ ...prev, selectDate: formatted }));
  };

  const openSelectDatePicker = () => {
    if (!selectDateRef.current) return;
    if (typeof selectDateRef.current.showPicker === "function") {
      selectDateRef.current.showPicker();
    } else {
      selectDateRef.current.click();
      selectDateRef.current.focus();
    }
  };
  const [openAddCustomStatusModal, setOpenAddCustomStatusModal] =
    useState(false);
  const [dragActive, setDragActive] = useState({
    primary: false,
    gallery: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [vendors, setVendors] = useState([]);

  // New states for dynamic questions
  const [categoryQuestions, setCategoryQuestions] = useState([]);
  const [subcategoryQuestions, setSubcategoryQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [selectedCategoryData, setSelectedCategoryData] = useState(null);
  const [selectedSubcategoryData, setSelectedSubcategoryData] = useState(null);

  const [primaryImagePreview, setPrimaryImagePreview] = useState(null);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const organizationId = user?.organization_id;

  const fieldTypes = [
    {
      id: "single-text",
      label: "Single Line Input",
      type: "Single Line Input",
    },
    {
      id: "single-selection",
      label: "Single Selection Input",
      type: "Single Selection Input",
    },
    {
      id: "multi-selection",
      label: "Multi Selection Input",
      type: "Multi Selection Input",
    },
    {
      id: "descriptive",
      label: "Descriptive Input",
      type: "Descriptive Input",
    },
    { id: "dropdown", label: "Drop Down Input", type: "Drop Down Input" },
  ];

  const getFieldTypeId = (typeName) => {
    const typeMap = {
      "Single Line Input": "single-text",
      "Single Selection Input": "single-selection",
      "Multi Selection Input": "multi-selection",
      "Descriptive Input": "descriptive",
      "Drop Down Input": "dropdown",
    };
    return typeMap[typeName] || "single-text";
  };

  const formatDateToDisplay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const fetchAssetData = async (assetId) => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get(
        `/${organizationId}/assets/${assetId}`
      );
      const asset = response.data.data;

      setFormData({
        assetName: asset?.assetName || "",
        assetNumber: asset?.assetNumber || "",
        category: asset?.category || "",
        brandSelection: asset?.brand || "",
        subCategory: asset?.subCategory || "",
        description: asset?.description || "",
        location: asset?.location === "static" ? "Static" : "Dynamic",
        selectVendor: asset?.vendor || "",
        selectDate: formatDateToDisplay(asset?.dateofbuy),
        value: asset?.value ? `$${asset?.value}` : "",
        type: asset?.depreciationType || "declining-balance",
        depreciationValue: asset?.depreciationValue
          ? `$${asset?.depreciationValue}`
          : "",
        durationYears: asset?.durationofDepreciation
          ? asset?.durationofDepreciation.toString()
          : "",
        date: formatDateToDisplay(asset?.dateofdepreciation),
        primaryImage: null,
        galleryImages: [],
      });

      // Parse description as question answers
      if (asset?.description) {
        try {
          const parsedAnswers = JSON.parse(asset?.description);
          setQuestionAnswers(parsedAnswers);
        } catch (err) {
          console.error("Error parsing description as JSON:", err);
        }
      }

      if (asset.primaryImage) {
        setPrimaryImagePreview(asset.primaryImage);
      }

      if (asset.galleryImage && Array.isArray(asset.galleryImage)) {
        setGalleryImagePreviews(asset.galleryImage);
      }

      if (asset.customStatus) {
        const statusArray = Object.entries(asset.customStatus).map(
          ([key, value]) => ({
            name: key,
            trackLocation: value,
            officeLocationSelection: false,
            rooms: false,
            notes: false,
            uploadPhoto: false,
          })
        );
        setCustomStatuses(statusArray);
      }
    } catch (err) {
      console.error("Error fetching asset:", err);
      setError("Failed to load asset data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `https://udoftqxd0e.execute-api.ap-south-1.amazonaws.com/dev/assets/categories`
      );
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const response = await axios.get(
        `https://udoftqxd0e.execute-api.ap-south-1.amazonaws.com/dev/assets/categories/${categoryId}/subcategories`
      );
      setSubcategories(response.data.data?.subcategories || []);
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      setSubcategories([]);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) return;

      const brandsResponse = await axiosPrivate.get(
        `/organizations/${organizationId}/brands`
      );
      setBrands(brandsResponse.data.brands || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  const fetchVendors = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const organizationId = user?.organization_id;

      if (!organizationId) return;

      const vendorsResponse = await axiosPrivate.get(
        `/vendors?organization_id=${organizationId}`
      );
      setVendors(vendorsResponse.data.vendors || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };
  const parseQuestions = (detailsString) => {
    try {
      if (!detailsString || detailsString === "{}") return [];
      const parsedDetails = JSON.parse(detailsString);
      return Object.entries(parsedDetails).map(([key, value]) => ({
        id: value.id,
        key,
        question: value.question,
        type: value.type,
        isMandatory: value.isMandatory,
        options: value.options || [],
      }));
    } catch (err) {
      console.error("Error parsing questions:", err);
      return [];
    }
  };

  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    const selectedCategory = categories.find(
      (cat) => cat.id.toString() === categoryId
    );

    setFormData((prev) => ({ ...prev, category: categoryId, subCategory: "" }));
    setSelectedCategoryData(selectedCategory);
    setSelectedSubcategoryData(null);
    setSubcategories([]);
    setSubcategoryQuestions([]);
    setQuestionAnswers({});

    if (selectedCategory) {
      // Parse category questions
      const questions = parseQuestions(selectedCategory.details);
      setCategoryQuestions(questions);

      // Fetch subcategories if subcategory is enabled (1)
      if (selectedCategory.subcategory === 1) {
        await fetchSubcategories(categoryId);
      } else {
        setSubcategories([]);
      }
    } else {
      setCategoryQuestions([]);
    }
  };

  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    const selectedSubcategory = subcategories.find(
      (sub) => sub.id.toString() === subcategoryId
    );

    setFormData((prev) => ({ ...prev, subCategory: subcategoryId }));
    setSelectedSubcategoryData(selectedSubcategory);
    setQuestionAnswers({});

    if (selectedSubcategory) {
      const questions = parseQuestions(selectedSubcategory.details);
      setSubcategoryQuestions(questions);
    } else {
      setSubcategoryQuestions([]);
    }
  };

  const handleQuestionAnswer = (questionKey, answer) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionKey]: answer,
    }));
  };

  const renderQuestionField = (question) => {
    const fieldTypeId = getFieldTypeId(question.type);
    const currentAnswer = questionAnswers[question.key] || "";

    switch (fieldTypeId) {
      case "single-text":
        return (
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleQuestionAnswer(question.key, e.target.value)}
            placeholder="Enter your answer"
            className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent"
            required={question.isMandatory}
          />
        );

      case "descriptive":
        return (
          <textarea
            value={currentAnswer}
            onChange={(e) => handleQuestionAnswer(question.key, e.target.value)}
            rows={4}
            placeholder="Enter detailed description"
            className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent resize-none"
            required={question.isMandatory}
          />
        );

      case "dropdown":
        return (
          <div className="relative">
            <select
              value={currentAnswer}
              onChange={(e) =>
                handleQuestionAnswer(question.key, e.target.value)
              }
              className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10"
              required={question.isMandatory}
            >
              <option value="">Select an option</option>
              {question.options?.map((option) => (
                <option key={option.optionNo} value={option.option}>
                  {option.option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        );

      case "single-selection":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.optionNo} className="flex items-center">
                <input
                  type="radio"
                  name={question.key}
                  value={option.option}
                  checked={currentAnswer === option.option}
                  onChange={(e) =>
                    handleQuestionAnswer(question.key, e.target.value)
                  }
                  className="w-4 h-4 text-[#ED1C24] bg-gray-100 border-gray-300 focus:ring-[#ED1C24] focus:ring-2"
                  required={question.isMandatory}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.option}
                </span>
              </label>
            ))}
          </div>
        );

      case "multi-selection":
        const selectedOptions = Array.isArray(currentAnswer)
          ? currentAnswer
          : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.optionNo} className="flex items-center">
                <input
                  type="checkbox"
                  value={option.option}
                  checked={selectedOptions.includes(option.option)}
                  onChange={(e) => {
                    const newSelectedOptions = e.target.checked
                      ? [...selectedOptions, option.option]
                      : selectedOptions.filter(
                          (item) => item !== option.option
                        );
                    handleQuestionAnswer(question.key, newSelectedOptions);
                  }}
                  className="w-4 h-4 text-[#ED1C24] bg-gray-100 border-gray-300 focus:ring-[#ED1C24] focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {option.option}
                </span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchCategories();
    fetchVendors();
    if (isEditMode && id) {
      fetchAssetData(id);
    }
  }, [id, isEditMode]);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const createOrUpdateAsset = async (assetData) => {
    try {
      setLoading(true);
      setError(null);

      if (!organizationId) {
        throw new Error("Organization ID not found. Please login again.");
      }

      // Prepare description from question answers
      const descriptionData = {};
      const activeQuestions = selectedSubcategoryData
        ? subcategoryQuestions
        : categoryQuestions;

      activeQuestions.forEach((question) => {
        const answer = questionAnswers[question.key];
        if (answer !== undefined && answer !== "") {
          descriptionData[question.key] = {
            id: question.id,
            type: question.type,
            question: question.question,
            isMandatory: question.isMandatory,
            answer: answer,
            ...(question.options &&
              question.options.length > 0 && { options: question.options }),
          };
        }
      });

      // Convert images to base64
      let primaryImageBase64 = null;
      if (assetData.primaryImage) {
        primaryImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(assetData.primaryImage);
        });
      } else if (primaryImagePreview && typeof primaryImagePreview === "string" && !primaryImagePreview.startsWith("blob:")) {
        // Keep existing URL
        primaryImageBase64 = primaryImagePreview;
      }

      // Convert gallery images to base64
      const galleryImagesBase64 = [];
      if (assetData.galleryImages && assetData.galleryImages.length > 0) {
        const newGalleryBase64 = await Promise.all(
          assetData.galleryImages.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );
        galleryImagesBase64.push(...newGalleryBase64);
      }

      // Keep existing gallery URLs
      const existingGalleryUrls = (galleryImagePreviews || []).filter(
        (p) => p && !p.startsWith("blob:")
      );
      galleryImagesBase64.push(...existingGalleryUrls);

      // Build JSON payload
      const payload = {
        organization_id: organizationId,
        assetName: assetData.assetName.trim(),
        assetNumber: assetData.assetNumber.trim(),
        brand: assetData.brandSelection,
        category: assetData.category,
        subCategory: assetData.subCategory,
        description: descriptionData,
        location: assetData.location.toLowerCase(),
        vendor: assetData.selectVendor,
        dateofbuy: convertToISODate(assetData.selectDate),
        value: parseFloat(assetData.value.replace(/[$,]/g, "")),
        depreciationType: assetData.type,
        depreciationValue: parseFloat(assetData.depreciationValue.replace(/[$,]/g, "")),
        durationofDepreciation: parseInt(assetData.durationYears),
        dateofdepreciation: convertToISODate(assetData.date),
        status: "active",
        primaryImage: primaryImageBase64,
        galleryImages: galleryImagesBase64.length > 0 ? galleryImagesBase64 : undefined,
      };

      if (customStatuses.length > 0) {
        payload.customStatus = customStatuses;
      }

      let response;
      if (isEditMode && id) {
        response = await axiosPrivate.put(`/${organizationId}/assets/${id}`, payload);
        console.log("Asset updated successfully:", response.data);
      } else {
        response = await axiosPrivate.post(`/${organizationId}/assets`, payload);
        console.log("Asset created successfully:", response.data);
      }

      navigate("/asset");
    } catch (err) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} asset:`,
        err
      );

      if (err.response) {
        const errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          `Server error: ${err.response.status}`;
        setError(errorMessage);
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const convertToISODate = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split("/");
    return `${year.padStart(4, "20")}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleLocationChange = (value) => {
    setFormData((prev) => ({ ...prev, location: value }));
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      if (type === "primary") {
        setFormData((prev) => ({ ...prev, primaryImage: file }));

        const previewUrl = URL.createObjectURL(file);
        setPrimaryImagePreview(previewUrl);
      } else {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, file],
        }));

        const previewUrl = URL.createObjectURL(file);
        setGalleryImagePreviews((prev) => [...prev, previewUrl]);
      }
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (type === "primary") {
      setFormData((prev) => ({ ...prev, primaryImage: file }));

      const previewUrl = URL.createObjectURL(file);
      setPrimaryImagePreview(previewUrl);
    } else {
      setFormData((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, file],
      }));

      const previewUrl = URL.createObjectURL(file);
      setGalleryImagePreviews((prev) => [...prev, previewUrl]);
    }

    if (error) setError(null);
  };

  const removePrimaryImage = () => {
    setFormData((prev) => ({ ...prev, primaryImage: null }));
    setPrimaryImagePreview(null);
  };

  const removeGalleryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
    setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    navigate("/asset");
  };

  const handleSubmit = async () => {
    if (!formData.assetName.trim()) {
      setError("Asset name is required");
      return;
    }
    if (!formData.assetNumber.trim()) {
      setError("Asset number is required");
      return;
    }
    if (!formData.brandSelection) {
      setError("Brand selection is required");
      return;
    }
    if (!formData.category) {
      setError("Category is required");
      return;
    }

    // Validate mandatory questions
    const activeQuestions = selectedSubcategoryData
      ? subcategoryQuestions
      : categoryQuestions;
    for (const question of activeQuestions) {
      if (question.isMandatory) {
        const answer = questionAnswers[question.key];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          setError(`${question.question} is required`);
          return;
        }
      }
    }

    const result = await createOrUpdateAsset(formData);
    
    // Refresh subscription data after successful creation/update
    if (result) {
      await refreshAfterAction();
    }
  };

  const handleRowAction = (record, index) => {
    console.log("Clicked row:", record, "at index", index);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Track Location",
      dataIndex: "trackLocation",
      key: "trackLocation",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Office Location Selection",
      dataIndex: "officeLocationSelection",
      key: "officeLocationSelection",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Rooms",
      dataIndex: "rooms",
      key: "rooms",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Upload Photo",
      dataIndex: "uploadPhoto",
      key: "uploadPhoto",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Actions",
      key: "action",
      width: "80px",
      render: (value, record) => (
        <Menu items={[]}>
          <button
            onClick={() => handleRowAction(record)}
            className="text-[#ED1C24] hover:text-blue-900 font-medium"
          >
            •••
          </button>
        </Menu>
      ),
    },
  ];

  const calculateDepreciation = (formData, setFormData) => {
    const { value, selectDate, type, depreciationValue } = formData;

    // Only calculate if we have all required values
    if (!value || !selectDate || !depreciationValue || !type) {
      return;
    }

    const assetValue = parseFloat(value.replace(/[$,]/g, ""));
    const depValue = parseFloat(depreciationValue.replace(/[$,%]/g, ""));

    if (assetValue > 0 && depValue > 0) {
      let years;
      if (type === "fixed") {
        years = Math.ceil(assetValue / depValue);
      } else {
        // percent
        // For percentage, calculate how many years to reach 0
        years = Math.ceil(100 / depValue);
      }

      // Calculate end date
      const [day, month, year] = selectDate.split("/");
      if (day && month && year) {
        const startDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        const endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + years);

        const endDateStr = `${endDate.getDate().toString().padStart(2, "0")}/${(
          endDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${endDate.getFullYear()}`;

        setFormData((prev) => ({
          ...prev,
          durationYears: years.toString(),
          date: endDateStr,
        }));
      }
    }
  };

  useEffect(() => {
    calculateDepreciation(formData, setFormData);
  }, [
    formData.value,
    formData.selectDate,
    formData.type,
    formData.depreciationValue,
  ]);

  // Updated depreciation value input onChange (simplified)
  const handleDepreciationValueChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, depreciationValue: value }));
    // Remove the calculation logic from here since useEffect will handle it
  };

  const handleTypeChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      type: e.target.value,
      depreciationValue: "",
      durationYears: "",
      date: "",
    }));
  };

  useSetLocationArray([
    { label: "Assets", link: "/asset" },
    { label: isEditMode ? "Edit Asset" : "Add New Asset", link: "" },
  ]);

  const activeQuestions = selectedSubcategoryData
    ? subcategoryQuestions
    : categoryQuestions;

  return (
    <Layout className="">
      <h1 className="text-xl font-semibold flex justify-between">
        {isEditMode ? "Edit Asset" : "Add Asset"}
        <div className="flex gap-x-3">
          <button
            onClick={handleCancel}
            className="text-black font-normal rounded-sm px-4 py-2 text-base"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="border border-[#ED1C24] text-white font-normal bg-[#ED1C24] rounded-sm px-4 py-2 text-base flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !formData.assetName.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update"
              : "Add"}
          </button>
        </div>
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="assetName"
                value={formData.assetName}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter asset name"
                className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="assetNumber"
                  value={formData.assetNumber}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter asset number"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Selection <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="brandSelection"
                    value={formData.brandSelection}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.brand_id} value={brand.brand_id}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    disabled={loading}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Category{" "}
                  {selectedCategoryData?.subcategory === 1 && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleSubcategoryChange}
                    disabled={
                      loading ||
                      !selectedCategoryData ||
                      selectedCategoryData.subcategory === 0
                    }
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">
                      {selectedCategoryData?.subcategory === 0
                        ? "No subcategories available"
                        : "Select Sub-Category"}
                    </option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.subCategoryName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {activeQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {selectedSubcategoryData ? "Sub-Category" : "Category"}{" "}
                  Details
                </h3>
                <div className="space-y-6">
                  {activeQuestions.map((question) => (
                    <div key={question.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {question.question}
                        {question.isMandatory && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      {renderQuestionField(question)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Location
              </h3>
              <div className="flex gap-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location"
                    value="Static"
                    checked={selectedCategoryData ? selectedCategoryData.track_location === 0 : formData.location === "Static"}
                    disabled={true}
                    className="w-4 h-4 text-[#ED1C24] bg-gray-100 border-gray-300 focus:ring-[#ED1C24] focus:ring-2 disabled:opacity-50 cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-gray-700">Static</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="location"
                    value="Dynamic"
                    checked={selectedCategoryData ? selectedCategoryData.track_location === 1 : formData.location === "Dynamic"}
                    disabled={true}
                    className="w-4 h-4 text-[#ED1C24] bg-gray-100 border-gray-300 focus:ring-[#ED1C24] focus:ring-2 disabled:opacity-50 cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-gray-700">Dynamic</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Purchase Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vendor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="selectVendor"
                      value={formData.selectVendor}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.vendorName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="selectDate"
                      value={formData.selectDate}
                      onChange={handleInputChange}
                      disabled={loading}
                      placeholder="DD/MM/YYYY"
                      className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent pr-10 disabled:opacity-50"
                    />
                    {/* Hidden native date input used to open calendar and set DD/MM/YYYY */}
                    <input
                      ref={selectDateRef}
                      type="date"
                      value={toInputDateValue(formData.selectDate)}
                      onChange={handleSelectDateFromPicker}
                      className="sr-only"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={openSelectDatePicker}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      aria-label="Open date picker"
                    >
                      <Calendar className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="$0.00"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Depreciation calculator
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleTypeChange}
                      disabled={loading}
                      className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent appearance-none pr-10 disabled:opacity-50"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percent">Percent</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depreciation value per year{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="depreciationValue"
                    value={formData.depreciationValue}
                    onChange={handleDepreciationValueChange}
                    disabled={loading}
                    placeholder={formData.type === "fixed" ? "$0.00" : "0%"}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-900 focus:ring-2 focus:ring-[#ED1C24] focus:border-transparent disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (in years) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="durationYears"
                    value={formData.durationYears}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="Years"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={true}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Image-</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Image
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive.primary
                        ? "border-[#d41920] bg-[#ED1C2408]"
                        : "border-[#ED1C24] bg-[#ED1C2408]"
                    } ${loading ? "pointer-events-none opacity-50" : ""}`}
                    onDragEnter={(e) => handleDrag(e, "primary")}
                    onDragLeave={(e) => handleDrag(e, "primary")}
                    onDragOver={(e) => handleDrag(e, "primary")}
                    onDrop={(e) => handleDrop(e, "primary")}
                  >
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "primary")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      disabled={loading}
                    />

                    {/* Image Preview */}
                    {primaryImagePreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={primaryImagePreview}
                            alt="Primary preview"
                            className="max-w-full max-h-32 object-contain mx-auto rounded"
                          />
                          <button
                            onClick={removePrimaryImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formData.primaryImage
                            ? formData.primaryImage.name
                            : "Current primary image"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                          <Upload className="h-6 w-6 text-[#ED1C24]" />
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Drag your image or{" "}
                            <span className="text-[#ED1C24] font-medium cursor-pointer">
                              browse
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Dimension 200*200
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.primaryImage && (
                      <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        <p>Selected: {formData.primaryImage.name}</p>
                        <p>
                          Size: {(formData.primaryImage.size / 1024).toFixed(1)}{" "}
                          KB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gallery Images
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive.gallery
                        ? "border-[#d41920] bg-[#ED1C2408]"
                        : "border-[#ED1C24] bg-[#ED1C2408]"
                    } ${loading ? "pointer-events-none opacity-50" : ""}`}
                    onDragEnter={(e) => handleDrag(e, "gallery")}
                    onDragLeave={(e) => handleDrag(e, "gallery")}
                    onDragOver={(e) => handleDrag(e, "gallery")}
                    onDrop={(e) => handleDrop(e, "gallery")}
                  >
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, "gallery")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      multiple
                      disabled={loading}
                    />

                    {/* Gallery Images Preview */}
                    {galleryImagePreviews.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {galleryImagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Gallery preview ${index + 1}`}
                                className="w-full h-16 object-cover rounded"
                              />
                              <button
                                onClick={() => removeGalleryImage(index)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                type="button"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          {galleryImagePreviews.length} image(s) selected
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-12 h-12 bg-[#ED1C2408] rounded-full flex items-center justify-center">
                          <Upload className="h-6 w-6 text-[#ED1C24]" />
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Drag your image or{" "}
                            <span className="text-[#ED1C24] font-medium cursor-pointer">
                              browse
                            </span>
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Dimension 200*200
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.galleryImages.length > 0 && (
                      <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        <p>Selected: {formData.galleryImages.length} file(s)</p>
                        <div className="mt-1 max-h-20 overflow-y-auto">
                          {formData.galleryImages.map((file, index) => (
                            <p key={index} className="text-xs">
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Custom Status
                </h3>
                <AddCustomStatusModal
                  open={openAddCustomStatusModal}
                  onOpenChange={setOpenAddCustomStatusModal}
                  onAdd={(newStatus) => {
                    console.log("status:", newStatus);
                    setCustomStatuses((prev) => [...prev, newStatus]);
                  }}
                >
                  <button
                    className="px-4 py-2 border border-[#ED1C24] bg-[#ED1C2408] rounded-md text-[#ED1C24] font-medium text-sm disabled:opacity-50"
                    disabled={loading}
                  >
                    Add Custom Status
                  </button>
                </AddCustomStatusModal>
              </div>
              {customStatuses.length > 0 && (
                <div className="mt-4">
                  <CustomDatatable
                    data={customStatuses}
                    columns={columns}
                    searchable={true}
                    pagination={true}
                    pageSize={10}
                    onRowAction={handleRowAction}
                    loading={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
