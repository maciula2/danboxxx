export const TagBadge = ({ name, category, onClick }) => (
  <span className={`mtag ${category}`} onClick={() => onClick(name)}>{name}</span>
)
