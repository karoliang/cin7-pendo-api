import React from 'react';
import { Tabs as PolarisTabs } from '@shopify/polaris';

export interface Cin7Tab {
  id: string;
  content: string;
  panelID?: string;
  accessibilityLabel?: string;
}

export interface Cin7TabsProps {
  tabs: Cin7Tab[];
  selected: number;
  onSelect: (selectedTabIndex: number) => void;
  fitted?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Cin7Tabs: React.FC<Cin7TabsProps> = ({
  tabs,
  selected,
  onSelect,
  fitted,
  className,
  children,
}) => {
  return (
    <div className={className}>
      <PolarisTabs tabs={tabs} selected={selected} onSelect={onSelect} fitted={fitted}>
        {children}
      </PolarisTabs>
    </div>
  );
};

Cin7Tabs.displayName = 'Cin7Tabs';

// Compatibility wrapper components for Radix UI Tabs API
export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export interface TabsListProps {
  children?: React.ReactNode;
  className?: string;
}

export interface TabsTriggerProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface TabsContentProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

// Context to share tabs state between compound components
const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  tabs: Array<{ value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }>;
  setTabs: (tabs: Array<{ value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }>) => void;
}>({
  value: '',
  onValueChange: () => {},
  tabs: [],
  setTabs: () => {},
});

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className }) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const [tabs, setTabs] = React.useState<Array<{ value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }>>([]);

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, tabs, setTabs }}>
      <div className={className} data-tabs-wrapper>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  const context = React.useContext(TabsContext);
  const [tabsData, setTabsData] = React.useState<Array<{ value: string; label: React.ReactNode; disabled?: boolean }>>([]);

  React.useEffect(() => {
    const newTabs: Array<{ value: string; label: React.ReactNode; disabled?: boolean }> = [];

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === TabsTrigger) {
        const childProps = child.props as any;
        newTabs.push({
          value: childProps.value,
          label: childProps.children,
          disabled: childProps.disabled,
        });
      }
    });

    setTabsData(newTabs);
  }, [children]);

  React.useEffect(() => {
    const existingContent = context.tabs.map(t => ({ value: t.value, content: t.content }));
    const newTabs = tabsData.map(tab => {
      const existing = existingContent.find(c => c.value === tab.value);
      return {
        ...tab,
        content: existing?.content || null,
      };
    });
    context.setTabs(newTabs);
  }, [tabsData, context]);

  // Convert tabs to Polaris format
  const polarisTabs = tabsData.map((tab) => ({
    id: tab.value,
    content: typeof tab.label === 'string' ? tab.label : String(tab.value),
    accessibilityLabel: typeof tab.label === 'string' ? tab.label : tab.value,
    panelID: `${tab.value}-content`,
  }));

  const selectedIndex = tabsData.findIndex((tab) => tab.value === context.value);

  if (polarisTabs.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <PolarisTabs
        tabs={polarisTabs}
        selected={selectedIndex >= 0 ? selectedIndex : 0}
        onSelect={(index) => {
          const selectedTab = tabsData[index];
          if (selectedTab) {
            context.onValueChange(selectedTab.value);
          }
        }}
      />
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, disabled }) => {
  // This component is used to define tab triggers
  // The actual rendering is done by TabsList
  return null;
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className }) => {
  const context = React.useContext(TabsContext);

  React.useEffect(() => {
    // Update the content for this tab value
    const updateTabs = (prevTabs: Array<{ value: string; label: React.ReactNode; content: React.ReactNode; disabled?: boolean }>) => {
      const existingIndex = prevTabs.findIndex((t) => t.value === value);
      if (existingIndex >= 0) {
        const newTabs = [...prevTabs];
        newTabs[existingIndex] = { ...newTabs[existingIndex], content: children };
        return newTabs;
      } else {
        return [...prevTabs, { value, label: value, content: children }];
      }
    };
    context.setTabs(updateTabs as any);
  }, [value, children, context]);

  // Only render if this is the active tab
  if (context.value === value) {
    return <div className={className}>{children}</div>;
  }

  return null;
};
