function Dashboard(props) {
  const [filterRow, setFilterRow] = React.useState('all');
  
  return (
    <form>
      <FilterBar filterRow={filterRow} onFilterRowChange={setFilterRow} />
      <DataTable datasrc={props.datasrc} filterRow={filterRow} />
    </form>
  );
}

function DataTable(props) {
  const columns = props.datasrc.getColumns();
  const [sortBy, setSortBy] = React.useState('Data');
  const [sortAsc, setSortAsc] = React.useState(true);
  const [filterData, setFilterData] = React.useState(Array(columns.length).fill(''));

  function handleSortChange(sortBy) {
    setSortBy(sortBy);
    setSortAsc(!sortAsc);
  }
  
  function handleFilterChange(i, value) {
    const newFilter = [...filterData];
    newFilter[i] = value;
    setFilterData(newFilter);
  }

  function getSortIdx() {
    return columns.indexOf(sortBy);
  }
  
  let sortIdx = getSortIdx();
  const params = {
    filterRow: props.filterRow,
    filterData: filterData,
    sortBy: sortBy,
    sortAsc: sortAsc,
  };
  const data = props.datasrc.getData(params);
  const rows = [];
  data.forEach((row, i) => {
    rows.push(<DataRow key={i} n={i} sortIdx={sortIdx} row={row} />);
  });
    
  return (
    <table className="table table-striped table-sm">
      <SortableHeader
        columns={columns}
        sortBy={sortBy}
        sortAsc={sortAsc}
        onSortChange={handleSortChange}
      />
      <tbody>{rows}</tbody>
      <tfoot>
        <SearchBar
          filter={filterData}
          onFilterChange={handleFilterChange}
        />
      </tfoot>
    </table>
  );
}

function DataRow(props) {
  const cols = [];
  props.row.forEach((value, i) => {
    let key = props.n + '_' + i;
    let cellClass = 'data-table-cell';
    if (i == props.sortIdx) cellClass += ' ' + cellClass + '-active';
    cols.push(<td className={cellClass} key={key}>{value}</td>);
  });
  return (<tr>{cols}</tr>);
}

function SortableHeader(props) {
  
  function handleSortClick(e) {
    props.onSortChange(e.target.dataset.sortBy);
  }

  const cols = [];
  props.columns.forEach((name) => {
    let columnClass = 'sortable-header';
      
    if (name === props.sortBy) {
      let suffix = props.sortAsc ? '-asc' : '-desc';
      columnClass += ' ' + columnClass + suffix;
    }

    cols.push(<th key={name} className={columnClass} data-sort-by={name} onClick={handleSortClick}>{name}</th>);
  });

  return (<thead><tr>{cols}</tr></thead>);
}

function SearchBar(props) {
  
  function handleFilterChange(e) {
    props.onFilterChange(e.target.dataset.idx, e.target.value);
  }
  
  let placeholder = 'Search...';
  const cols = [];
  props.filter.forEach((value, i) => {
    cols.push(
      <td key={i}>
        <input
          className="search-bar-filter"
          placeholder={placeholder}
          type="text"
          data-idx={i}
          value={value}
          onChange={handleFilterChange}
        />
      </td>
    );
    placeholder = '';
  });
  
  return (<tr>{cols}</tr>);
}

function FilterBar(props) {
  
  let elem = document.getElementById('filterbar-root');
  return ReactDOM.createPortal(
    <React.Fragment>
      <FilterButton
        filterRow={props.filterRow}
        onClick={props.onFilterRowChange}
        value="even"
        icon="bi-dice-2"
        caption="Even rows of data"
        subcaption="Display rows 2,4,6 etc."
      />
      <FilterButton
        filterRow={props.filterRow}
        onClick={props.onFilterRowChange}
        value="odd"
        icon="bi-dice-1"
        caption="Odd rows of data"
        subcaption="Display rows 1,3,5 etc."
      />
      <FilterButton
        filterRow={props.filterRow}
        onClick={props.onFilterRowChange}
        value="all"
        icon="bi-dice-3"
        caption="All data"
        subcaption="Display all data"
      />
    </React.Fragment>,
    elem
  );
}

function FilterButton(props) {
  
  function handleClick() {
    props.onClick(props.value);
  }
  
  let iconClass = props.icon + ' filter-bar-btn-icon';
  let btnClass = 'nav-link filter-bar-btn';
  if (props.filterRow === props.value) {
    btnClass += ' filter-bar-btn-active';
  }

  return (
    <li className="nav-item">
      <a className={btnClass} aria-current="page" href="#" onClick={handleClick}>
        <i className={iconClass}></i>
        {props.caption}
        <span className="filter-bar-btn-subcaption">{props.subcaption}</span>
      </a>
    </li>
  );
}

class DataSource {

  constructor(data) {
    this.data = data;
  }
  
  getColumns() {
    let cols = ['Data'];
    this.data[0].summary.forEach((v, i) => {
      cols.push('Summary' + String(i + 1));
    });
    return cols;
  }

  getData(params) {
    this.params = params;
    this._sort();
    const rows = [];
    this.data.forEach((entry, i) => {
      const row = [entry.data, ...entry.summary];
      if (this._isEntryAllowed(row, i + 1)) {
        rows.push(row);
      }
    });
    return rows;
  }
  
  _sort() {
    this.data.sort((a, b) => {
      let x = this._getEntrySortValue(a);
      let y = this._getEntrySortValue(b);

      if (x == y) return 0;
      let result = 1;
      if (x < y) result = -1;
      if (!this.params.sortAsc) result *= -1;
      return result;
    });
  }

  _getEntrySortValue(entry) {
    if (this.params.sortBy === 'Data') return entry.data;
    let index = parseInt(this.params.sortBy.replace(/[^\d]/g, ''), 10) - 1;
    return entry.summary[index];
  }
  
  _isEntryAllowed(row, rowNum) {
    let isOdd = rowNum % 2;
    if (this.params.filterRow === 'even' && isOdd) return false;
    if (this.params.filterRow === 'odd' && !isOdd) return false;

    let skip = this.params.filterData.find((filterValue, index) => {
      if (String(row[index]).indexOf(filterValue) === -1) return true;
    });
    if (skip) return false;
    return true;
  }
}

const DATA = [
  {data: 'Data1', summary: [186, 186, 92,  8,  1]},
  {data: 'Data2', summary: [95,  95,  31,  11, 0]},
  {data: 'Data3', summary: [329, 329, 256, 32, 4]},
  {data: 'Data4', summary: [804, 804, 697, 40, 22]},
];

let datasrc = new DataSource(DATA);
const root = ReactDOM.createRoot(document.getElementById('table-root'));
root.render(<Dashboard datasrc={datasrc} />);

