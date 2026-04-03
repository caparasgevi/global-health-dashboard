export const formatWHOData = (rawData: any[]) => {
  if (!rawData) return [];

  return rawData
    .filter(item => item.NumericValue !== null) 
    .map(item => ({
      country: item.SpatialDim,               
      year: parseInt(item.TimeDim),           
      value: Math.round(item.NumericValue),   
      label: item.Value                       
    }))
    .sort((a, b) => a.year - b.year);         
};