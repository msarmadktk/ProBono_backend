const db = require('../config/db')

exports.createProfile = async (req, res) => {
  try {
    const {
      userId,
      skills,
      bio,
      experienceLevel,
      hourly_rate,
      title,
      profile_image,
      is_public
    } = req.body

    // Check if profile already exists
    const profileExists = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    )
    if (profileExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Profile already exists for this user' })
    }

    // Check if user exists and is a freelancer
    const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [
      userId
    ])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (userCheck.rows[0].user_type !== 'freelancer') {
      return res
        .status(400)
        .json({ error: 'Only freelancers can have profiles' })
    }

    // Insert profile with all fields
    const result = await db.query(
      `INSERT INTO profiles 
       (user_id, skills, bio, experience_level, hourly_rate, title, profile_image, is_public) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        userId,
        skills,
        bio,
        experienceLevel || 'Entry-Level',
        hourly_rate,
        title,
        profile_image,
        is_public === undefined ? true : is_public
      ]
    )

    res.status(201).json({
      message: 'Profile created successfully',
      profile: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating profile:', error)
    res.status(500).json({ error: 'Server error while creating profile' })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const userId = req.params.userId

    const profileResult = await db.query(
      `SELECT p.*, u.email
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    )

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Get portfolio items
    const portfolioResult = await db.query(
      'SELECT * FROM portfolioitems WHERE profile_id = $1 ORDER BY created_at DESC',
      [profileResult.rows[0].id]
    )

    const rawProfile = profileResult.rows[0]
    let parsedSkills

    try {
      parsedSkills = JSON.parse(rawProfile.skills)
    } catch {
      parsedSkills = rawProfile.skills?.split(',').map(s => s.trim()) || []
    }

    rawProfile.skills = parsedSkills

    res.json({
      profile: rawProfile,
      portfolioItems: portfolioResult.rows
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Server error while fetching profile' })
  }
}

exports.addPortfolioItem = async (req, res) => {
  try {
    const userId = req.params.userId
    const { projectTitle, description, mediaLinks } = req.body

    // Get profile ID
    const profileResult = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    )
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const profileId = profileResult.rows[0].id

    // Add portfolio item
    const result = await db.query(
      'INSERT INTO portfolioitems (profile_id, project_title, description, media_links) VALUES ($1, $2, $3, $4) RETURNING *',
      [profileId, projectTitle, description, mediaLinks]
    )

    res.status(201).json({
      message: 'Portfolio item added successfully',
      portfolioItem: result.rows[0]
    })
  } catch (error) {
    console.error('Error adding portfolio item:', error)
    res.status(500).json({ error: 'Server error while adding portfolio item' })
  }
}

exports.getPortfolioItems = async (req, res) => {
  try {
    const userId = req.params.userId

    // Get profile ID
    const profileResult = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    )
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const profileId = profileResult.rows[0].id

    // Get portfolio items
    const portfolioResult = await db.query(
      'SELECT * FROM portfolioitems WHERE profile_id = $1 ORDER BY created_at DESC',
      [profileId]
    )

    res.json(portfolioResult.rows)
  } catch (error) {
    console.error('Error fetching portfolio items:', error)
    res
      .status(500)
      .json({ error: 'Server error while fetching portfolio items' })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId
    const {
      skills,
      bio,
      experienceLevel,
      hourly_rate,
      title,
      profile_image,
      is_public
    } = req.body

    // Find profile
    const profileResult = await db.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    )
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    // Update profile
    const result = await db.query(
      `UPDATE profiles 
       SET skills = COALESCE($1, skills), 
           bio = COALESCE($2, bio), 
           experience_level = COALESCE($3, experience_level),
           hourly_rate = COALESCE($4, hourly_rate),
           title = COALESCE($5, title),
           profile_image = COALESCE($6, profile_image),
           is_public = COALESCE($7, is_public),
           updated_at = NOW()
       WHERE user_id = $8 
       RETURNING *`,
      [
        skills,
        bio,
        experienceLevel,
        hourly_rate,
        title,
        profile_image,
        is_public,
        userId
      ]
    )

    // Get portfolio items
    const portfolioResult = await db.query(
      'SELECT * FROM portfolioitems WHERE profile_id = $1 ORDER BY created_at DESC',
      [profileResult.rows[0].id]
    )

    res.json({
      message: 'Profile updated successfully',
      profile: result.rows[0],
      portfolioItems: portfolioResult.rows
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Server error while updating profile' })
  }
}

// NEW ROUTES CONTROLLERS

/* Find the profile ID using userId.
 Make sure that portfolioItemId belongs to that profile.
 Delete if valid. */

exports.deletePortfolioItem = async (req, res) => {
  try {
    const { userId, portfolioItemId } = req.params

    // Step 1: Find the profile for the given user
    const profileRes = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    )

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const profileId = profileRes.rows[0].id

    // Step 2: Check if the portfolio item belongs to this profile
    const itemCheck = await db.query(
      'SELECT * FROM portfolioitems WHERE id = $1 AND profile_id = $2',
      [portfolioItemId, profileId]
    )

    if (itemCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Portfolio item not found or unauthorized' })
    }

    // Step 3: Delete the portfolio item
    await db.query('DELETE FROM portfolioitems WHERE id = $1', [
      portfolioItemId
    ])

    res.status(200).json({ message: 'Portfolio item deleted successfully' })
  } catch (error) {
    console.error('Error deleting portfolio item:', error)
    res
      .status(500)
      .json({ error: 'Server error while deleting portfolio item' })
  }
}

/*
Verifies the profile and ownership.
Only updates provided fields (others remain unchanged).
Returns the updated item in the response.
*/

exports.updatePortfolioItem = async (req, res) => {
  try {
    const { userId, portfolioItemId } = req.params
    const { projectTitle, description, mediaLinks } = req.body

    // Step 1: Get the profile for the user
    const profileRes = await db.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [userId]
    )

    if (profileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    const profileId = profileRes.rows[0].id

    // Step 2: Verify the item belongs to the user's profile
    const itemCheck = await db.query(
      'SELECT * FROM portfolioitems WHERE id = $1 AND profile_id = $2',
      [portfolioItemId, profileId]
    )

    if (itemCheck.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Portfolio item not found or unauthorized' })
    }

    // Step 3: Update the item
    const result = await db.query(
      `UPDATE portfolioitems 
       SET project_title = COALESCE($1, project_title),
           description = COALESCE($2, description),
           media_links = COALESCE($3, media_links)
       WHERE id = $4
       RETURNING *`,
      [projectTitle, description, mediaLinks, portfolioItemId]
    )

    res.status(200).json({
      message: 'Portfolio item updated successfully',
      portfolioItem: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating portfolio item:', error)
    res
      .status(500)
      .json({ error: 'Server error while updating portfolio item' })
  }
}
