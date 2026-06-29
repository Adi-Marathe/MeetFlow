export function PageWrapper({ children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {children}
    </div>
  );
}
