import React from 'react';

import withStyles from '@material-ui/core/styles/withStyles';

import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';

import Slider from '@material-ui/core/Slider';

import DeleteIcon from '@material-ui/icons/Delete';


const styles = theme => ({
    variableSlider: {
        paddingLeft: 0,
        paddingRight: 0
    }
});

function VariableSlider({onChange, name, value, onDelete, classes}) {
    return (
        <ListItem>
            <div className='variable-slider'>
                <Typography variant='body2'>
                    {name + ' = ' + value.toFixed(3)}
                </Typography>
                <Slider
                    ref='slider'
                    classes={{root: classes.variableSlider}}
                    min={0}
                    max={1}
                    value={value}
                    onChange={onChange}
                />
            </div>
            <ListItemSecondaryAction>
                <IconButton onClick={onDelete}>
                    <DeleteIcon/>
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    );
}

export default withStyles(styles)(VariableSlider);
