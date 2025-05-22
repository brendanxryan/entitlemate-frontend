import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

// Basic input and button styling
const Input = (props) => <input {...props} />;
const Button = ({ children, onClick, variant }) => (
  <button
    onClick={onClick}
    className={variant === 'default' ? 'active' : ''}
  >
    {children}
  </button>
);
const Card = ({ children }) => <div className="card">{children}</div>;
const CardContent = ({ children }) => <div>{children}</div>;

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
    <div>
      <Input
        placeholder="Search entitlements, strategies, or age bands (e.g. 67-75)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="filter-bar">
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
        <div key={field} className="filter-bar">
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

      <div className="grid">
        {filteredItems.map((item, i) => (
          <Card key={i}>
            <CardContent>
              <h2>{item.Name}</h2>
              <p><strong>{item.Headline}</strong></p>
              <p>{item.Description}</p>
              {item.ValueEstimate && (
                <p><strong>Estimated value:</strong> ${item.ValueEstimate}</p>
              )}
              {item.GovLink && (
                <p><a href={item.GovLink} target="_blank" rel="noreferrer">Gov Link</a></p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
