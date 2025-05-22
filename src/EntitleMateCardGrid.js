import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const Input = (props) => <input {...props} className="border border-gray-300 p-2 rounded w-full max-w-xl" />;
const Button = ({ children, onClick, variant }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded border text-sm font-medium ${
      variant === 'default' ? 'bg-blue-600 text-white' : 'bg-white text-black border-gray-400'
    }`}
  >
    {children}
  </button>
);
const Card = ({ children }) => <div className="border rounded shadow bg-white p-4">{children}</div>;
const CardContent = ({ children }) => <div className="space-y-2">{children}</div>;

const SHEET_URL = 'https://api.sheetbest.com/sheets/6b9a06de-35b8-4983-865d-54518ebdf66a';

const getUniqueMultiSelectValues = (items, field) => {
  const set = new Set();
  items.forEach(item => {
    if (item[field]) {
      item[field].split(',').map(s => s.trim()).forEach(v => set.add(v));
    }
  });
  return Array.from(set).filter(Boolean);
};

const ageOptions = ['<55', '55-60', '60-65', '65-67', '67-75', '75+'];

export default function EntitleMateCardGrid() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    Category: [],
    State: [],
    AgeGroup: [],
    LifeEvent: [],
    PaymentType: [],
    RelationshipStatus: [],
    HomeOwnership: [],
    CardType: [],
  });

  useEffect(() => {
    axios.get(SHEET_URL).then(res => {
      setItems(res.data.filter(item => item.Status === 'Published'));
    });
  }, []);

  const multiSelectFields = Object.keys(filters);
  const options = {};
  multiSelectFields.forEach(field => {
    if (field !== 'AgeGroup') {
      options[field] = getUniqueMultiSelectValues(items, field);
    }
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const searchText = search.toLowerCase();
      const matchesSearch = (
        item.Name.toLowerCase().includes(searchText) ||
        (item.Headline && item.Headline.toLowerCase().includes(searchText)) ||
        (item.Description && item.Description.toLowerCase().includes(searchText))
      );

      const matchesFilters = Object.keys(filters).every(field => {
        const filterValues = filters[field];
        if (filterValues.length === 0) return true;

        if (field === 'AgeGroup') {
          return filterValues.some(age => item[age] && item[age].toLowerCase() === 'true');
        }

        const itemValues = (item[field] || '').split(',').map(v => v.trim());
        return filterValues.some(val => itemValues.includes(val));
      });

      return matchesSearch && matchesFilters;
    });
  }, [items, search, filters]);

  const toggleFilter = (field, value) => {
    setFilters(prev => {
      const current = new Set(prev[field]);
      current.has(value) ? current.delete(value) : current.add(value);
      return { ...prev, [field]: Array.from(current) };
    });
  };

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">
      <Input
        placeholder="Search entitlements, strategies, or age bands (e.g. 67-75)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {ageOptions.map(opt => (
          <Button
            key={opt}
            variant={filters.AgeGroup.includes(opt) ? 'default' : 'outline'}
            onClick={() => toggleFilter('AgeGroup', opt)}
          >
            {opt}
          </Button>
        ))}
      </div>

      {multiSelectFields.filter(f => f !== 'AgeGroup').map(field => (
        <div key={field} className="flex flex-wrap gap-2">
          {options[field].map(opt => (
            <Button
              key={opt}
              variant={filters[field].includes(opt) ? 'default' : 'outline'}
              onClick={() => toggleFilter(field, opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, i) => (
          <Card key={i}>
            <CardContent>
              <h2 className="text-lg font-semibold">{item.Name}</h2>
              <p className="text-sm text-gray-600">{item.Headline}</p>
              <p className="text-sm">{item.Description}</p>
              {item.ValueEstimate && (
                <p className="text-sm font-bold">Estimated value: ${item.ValueEstimate}</p>
              )}
              {item.GovLink && (
                <a href={item.GovLink} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Gov Link</a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
