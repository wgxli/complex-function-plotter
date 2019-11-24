import React, {PureComponent} from 'react';

import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';

import FreeformIcon from '@material-ui/icons/Brush';
import ClosedLoopIcon from '@material-ui/icons/SettingsBackupRestore';
import CircleIcon from '@material-ui/icons/PanoramaFishEye';


const calculators = [
    {
        strategy: 'freeform',
        label: 'Freeform',
        icon: <FreeformIcon/>,
    },
    {
        strategy: 'freeform-closed',
        label: 'Freeform (Closed Loop)',
        icon: <ClosedLoopIcon/>,
    },
    {
        strategy: 'circle',
        label: 'Circular Contour',
        icon: <CircleIcon/>,
    },
];

class IntegralPanel extends PureComponent {
    renderIntegrator(entry) {
        const {strategy, label, icon} = entry;
        const {hidePanels, openCalculator} = this.props;

        const onClick = () => {
            // Hide panels on mobile
            if (window.innerWidth < 700) {hidePanels();}

            // Close existing calculator, if present
            openCalculator(null);

            // Show desired integral calculator
            // (setTimeout to ensure old calculator closes)
            setTimeout(() => openCalculator(strategy), 0);
        };

        return <ListItem button key={strategy} onClick={onClick}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText style={{paddingLeft: 0}}>{label}</ListItemText>
        </ListItem>;
    }

    render() {
        return <List>
            <ListSubheader disableSticky>Contour Integrals</ListSubheader>
            {calculators.map(this.renderIntegrator.bind(this))}
        </List>;
    }
}

export default IntegralPanel;
