import React, { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

interface LocationPickerProps {
  label: string;
  value: string;
  onSelect: (location: string) => void;
  placeholder: string;
}

const locations = ["Campus", "Kuril", "Jamuna Future Park"];

export const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  value,
  onSelect,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (location: string) => {
    onSelect(location);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
            <span className={value ? "text-gray-900" : "text-gray-500"}>
              {value || placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            {locations.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => handleSelect(location)}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
              >
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                {location}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
